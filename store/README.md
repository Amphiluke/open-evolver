The `store` directory is used to collect files quickly accessible from a “Store” in the running application (the `Open store` item in the `File` menu). These files may be in any format supported by “Open evolver”. They may also be organized in sub-directories within the `store` directory. If you want these files to be stored in a separate location, just create a symbolic link (or a junction point) to the desired location in the current directory.

Note that the contents of the `store` directory is not under the version control (see [.gitignore](https://github.com/Amphiluke/open-evolver/blob/master/.gitignore#L28)) since it's unrelated to the project codebase.

To make the store work after copying the sources to the production

1. fill this directory in (add any number of nanostructure files and/or make symlinks to another file storage);
2. create a configuration JSON file `info.json` and place it directly to the `store` directory.

The `info.json` file contains a list of structures available to the “Store” and all metadata required by the application. Here is an example of such a configuration JSON file with 2 structures in it.

```json
[
  {
    "path": "Ni172.hin",
    "name": "Ni172",
    "description": "Face-centered cubic nickel nanoparticle"
  },
  {
    "path": "nano/graphene.ml2",
    "name": "Graphene",
    "description": "Nanoscale graphene sheet 10×10 nm"
  }
]
```