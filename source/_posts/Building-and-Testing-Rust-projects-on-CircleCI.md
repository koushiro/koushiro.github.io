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

- Setup build environment (Use ~~docker(image: ubuntu 18.04) and~~ [rustup](https://rustup.rs/))
- Check code format (Use [rustfmt](https://github.com/rust-lang/rustfmt))
- Check a collection of lints to catch common mistakes and improve your code (Use [rust-clippy](https://github.com/rust-lang/rust-clippy))
- Build and Test
- Code coverage measurement (Use [kcov](https://github.com/SimonKagstrom/kcov) and [Codecov](https://codecov.io/))

## Full CircleCI configuration

```yaml
version: 2.1
jobs:
  build:
    machine: true

    working_directory: ~/rust-demo

    steps:
      - checkout
      - run:
          name: Setup build environment
          command: |
            sudo apt-get update
            sudo apt-get install -y cmake binutils-dev libcurl4-openssl-dev libiberty-dev libelf-dev libdw-dev
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --no-modify-path --default-toolchain none -y;
          no_output_timeout: 1800s
      - run:
          name: Format
          command: |
            export PATH=~/.cargo/bin:$PATH
            rustup component add rustfmt
            cargo fmt --all -- --check
      - run:
          name: Clippy
          command: |
            export PATH=~/.cargo/bin:$PATH
            rustup component add clippy
            cargo clippy --all -- -D warnings
      - run:
          name: Test
          command: |
          	export PATH=~/.cargo/bin:$PATH
            export RUST_BACKTRACE=1
          	cargo test
      - run:
          name: Coverage
          command: |
          	export PATH=~/.cargo/bin:$PATH
            # install kcov
            cargo install cargo-kcov
            cargo kcov --print-install-kcov-sh | sh
            echo "Install kcov successfully"
            # coverage
            cargo kcov --all
            bash <(curl -s https://codecov.io/bash)
            echo "Upload code coverage successfully"
      
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

## Update (2019-09-11)

Using **machine** instead of **docker** to repair code coverage (`kcov`) failed.

Use `cargo-kcov` subcommand to measure code coverage.

## Reference

[Circle CI Document](https://circleci.com/docs/)
