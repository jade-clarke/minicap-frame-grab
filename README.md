```sh
adb forward tcp:1717 localabstract:minicap
```

```sh
adb shell "LD_LIBRARY_PATH=/data/local/tmp /data/local/tmp/minicap -P 1080x1920@1080x1920/90 -r 5"
```