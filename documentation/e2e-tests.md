# E2E Testing

To run E2E tests locally, run the `avash_axiajs_e2e.sh` script and pass in two arguments. The first is your full working directory of your Avash directory, and the second is the full working directory of your AxiaJS directory.

`./avash_axiajs_e2e.sh "<avash dir>" "<axiajs dir>"`

For example,

`./avash_axiajs_e2e.sh "/path/to/avash/" "/path/to/axiajs/"`

This script runs the five node script by default.

- New E2E tests go in the /e2e_tests/ directory.

Follow the steps below if you do not wish to use the five node script, but instead test against one of the nodes. You provide the PORT of the specified node.

## Avash

This option does not require executing a docker container, but it may not lead to the same results of CI, depending on the branch, version, and configuration options of the nodes executed by avash.

* Launch `avash`
* Set env vars `AXIAGO_IP`, `AXIAGO_PORT` to point to one of the nodes of avash
* From axiajs dir execute: `yarn test -i --roots e2e_tests`

Example workflow

```zsh
cd /path/to/avash
 ./avash
avash> runscript scripts/five_node_staking.lua

# Open another terminal tab/window
cd /path/to/axiajs
AXIAGO_IP=localhost AXIAGO_PORT=80 yarn test -i --roots e2e_tests
```
