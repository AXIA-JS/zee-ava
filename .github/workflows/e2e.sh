mount_spec=$(pwd):/axiajs/
image=avaplatform/axia-testing:master

echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin
custom_params_json="{
    \"axiagoImage\":\"/axiajs/axiago/build/\",
    \"testParams\": {\"axiaJS\": { \"dir\": \"/axiajs/\" } },
    \"executeTests\":[\"AxiaJS\"]
}"

docker run -v $mount_spec $image ./local-e2e-tests.bin --custom-params-json="${custom_params_json}"
