This app is a file viewer with a menu for selecting files,
and a viewer for the file itself.

First, the root of the folder to be viewed needs to be setup,
for now it will be hardcoded (but  use a variable so it can change) to `/home/felipe/memos` (this doesn't exist in this project, but it does exist in the current computer).

In the main page, we need to show a component that shows all files.
For now make it simple, and simply show a list of all files, with their full relative paths.
Just a list, don't implement a tree structure. Each file can be clicked, and it should redirect to the next page:

The data fetch should be implemented in the Node app, and then used in the frontend.
Implement the API and then a React component that fetches and displayes the data.

Then we need to show the viewer. Implement a react route that looks like /view?file=full-relative-path

When the path changes, it should fetch the file content (the file content read should also be implemented in the API)

For now assume all files are text files, so the content should be rendered as-is in another component for files.

