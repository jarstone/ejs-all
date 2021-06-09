
# ejs-all

Compile all ejs files in bulk.

## Installation
`npm i ejs-all -g`


## Features

- Support `watch` mode
- Support subdirectories
- Keep directory structure from source and destination
- In `watch` mode, only compile related files change
- The result is beautified by default

  
## Example

To compile all files run

```bash
  ejs-all --input=src/ejs --data=src/ejs/data.json --output=dist/html
```

For `watch` mode run

```bash
  ejs-all --input=src/ejs --data=src/ejs/data.json --output=dist/html --watch
```

  
## Options

| Parameter | Description |
| :-------- | :------- |
| `--input=[dir]` | **Required**. Input directory |
| `--data=[file.json]` | **Required**. Data file |
| `--output=[dir]` | **Required**. Output directory |
| `--watch` | Enable watch mode |
| `--delay=[ms]` | The millisecond delay between a file change and task execution. Default: 200 |

## FAQ

#### Can i change the ejs option ?

No, all options are default

#### The included files are also compiled, how to ignore it ?

For partial files, use an underscore for the first letter of the filename. Example: `_sidebar.ejs`

  
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/jarstone/ejs-all/blob/main/LICENSE)

  
