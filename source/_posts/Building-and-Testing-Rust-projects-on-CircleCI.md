---
title: Building and Testing Rust projects on CircleCI
tags: [tech, CI, Rust, config]
date: 2019-04-30 15:32:38
---

<center>Configure CircleCI for Rust projects.</center>

<!-- more -->

---

# Building and Testing Rust projects on CircleCI

## Steps

- Setup build environment (Use docker(image: ubuntu 18.04) and [rustup](https://rustup.rs/))
- Check code format (Use [rustfmt](https://github.com/rust-lang/rustfmt))
- Check a collection of lints to catch common mistakes and improve your code (Use [rust-clippy](https://github.com/rust-lang/rust-clippy))
- Build and Test
- Code coverage measurement (Use [kcov](https://github.com/SimonKagstrom/kcov) and [Codecov](https://codecov.io/))

## Full CircleCI configuration

```yaml
version: 2.1
jobs:
  build:
    docker:
      - image: ubuntu:18.04

    working_directory: ~/rust-demo-ci

    steps:
      - checkout

      - run:
          name: Setup build environment
          command: |
            apt update
            apt install -y curl wget build-essential zlib1g-dev python libcurl4-openssl-dev libelf-dev libdw-dev cmake binutils-dev libiberty-dev
            # if there is no `rust-toolchain` file in the rust project, please specify the default toolchain.
            # example: `--default-tolchain stable` or `--default-toolchain nightly`
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --no-modify-path --default-toolchain none -y;
            source $HOME/.cargo/env
          no_output_timeout: 1800s

      - run:
          name: Format
          command: |
            export PATH=~/.cargo/bin:$PATH
            rustup component add rustfmt
            cargo fmt -- --check

      - run:
          name: Clippy
          command: |
            export PATH=~/.cargo/bin:$PATH
            rustup component add clippy
            cargo clippy --all

      - run:
          name: Test
          command: |
            export PATH=~/.cargo/bin:$PATH
            export RUST_BACKTRACE=1
            cargo test

      - run:
          name: Coverage
          command: |
            # install kcov
            export KCOV_VERSION=36
            wget https://github.com/SimonKagstrom/kcov/archive/v$KCOV_VERSION.tar.gz
            tar xzf v$KCOV_VERSION.tar.gz && rm v$KCOV_VERSION.tar.gz
            cd kcov-$KCOV_VERSION
            mkdir build && cd build
            cmake .. && make && make install DESTDIR=../../kcov-build
            cd ../.. && rm -rf kcov-$KCOV_VERSION

            # generate and upload code coverage
            for file in $(find target/debug -maxdepth 1 -name '*-*' -a ! -name '*.d' ! -name '.*'); do
              [ -x "${file}" ] || continue
              mkdir -p "target/cov/$(basename $file)"
              ./kcov-build/usr/local/bin/kcov --exclude-pattern=/.cargo,/usr/lib --verify "target/cov/$(basename $file)" "$file"
            done
            bash <(curl -s https://codecov.io/bash)
            echo "Uploaded code coverage"

workflows:
  version: 2.1
  build:
    jobs:
      - build

```

## Reference

[Circle CI Document](https://circleci.com/docs/)

