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
      - image: circleci/rust:latest

    working_directory: ~/rust-demo-ci

    steps:
      - checkout
      - run:
          name: Version information
          command: |
            rustc --version
            cargo --version
            rustup --version
      - run:
          name: Setup build environment
          command: |
            sudo apt-get update
            sudo apt-get install -y cmake binutils-dev libiberty-dev libelf-dev libdw-dev
          no_output_timeout: 1800s
      - run:
          name: Format
          command: |
            rustup component add rustfmt
            cargo fmt -- --check
      - run:
          name: Clippy
          command: |
            rustup component add clippy
            cargo clippy --all
      - run:
          name: Test
          command: RUST_BACKTRACE=1 cargo test
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

## Update (2019-05-07)

The `personality` syscall required by `kcov` is **DISABLED** by Docker, so test coverage cannot be measured... (Not fix yet, may be you can use a Machine executor instead of a Docker executor)

[kcov issue #151](https://github.com/SimonKagstrom/kcov/issues/151)
[circleci discuss link](https://discuss.circleci.com/t/cargo-tarpaulin-fails/30215)

## Reference

[Circle CI Document](https://circleci.com/docs/)
