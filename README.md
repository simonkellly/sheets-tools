# sheets-tools

To run this program you will need [bun](https://bun.sh/) installed.

You will need to setup authentication for google spreadsheets as listed (here)[https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication?id=service-account]. You can place the info in a file at the root of the project called creds.json and an example is shown also

So set which spreadsheet you are using, create a .env file at the root of the project similar to the .example.env file with the id of the sheet.
This is found within the url of google sheets, which is structured like: `https://docs.google.com/spreadsheets/d/[sheet id is here]/edit`. You may also have to adjust the names of the individual sheets within the scripts (such as dump-xcenters) in order to chooose the commms to use.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run # This will print a list of availible commands

bun run xcenters # This produces an out/xcenters.csv file which can be imported into anki or similar programs
```