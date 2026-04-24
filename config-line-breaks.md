The deployment tells you to specify the bookmarks path.
Now let's change that to "config path" (directory, not file),
and the app will use (or create if not exists):
bookmarks.json , app.json (file names are hardcoded like that).
bookmarks.json has the same specification as what I explained in the README and it's also in the source code, so
don't touch that.

We will use Context API with getters/setters to set the configuration globally (app.json values).

The values will be set from localStorage on frontend load (only once), following default values conventions if they don't exist.
localStorage will store the whole JSON on one key as JSON stringified.

Then, the values need to be synced from server in case they have changed
(I think Layout on mount would be one good place to put it, when the app loads).
This fetch updates the localStorage and sets the values in the context.
This means that if the user first loads a markdown viewer page, the line breaks
may look different for a split second, but that's alright (it's expected behavior).

Implement an API call to upsert the app.json file. Implement zod validations
in the api endpoint, similar to other endpoints I have (take a look at the patterns).
Read the file using Zod, and pass default values to the options.

When saving, we will first set the global state, then save on localStorage. Then
in an async fashion we do an API call to save the file in the server. Disable the button
while saving, and show an error toast if there's an error.

Put a button on top of the markdown file viewer that does this toggle.

Right now there's only one option, strictLineBreaks (boolean, default value false).
Ignore other values in the object.  If the value has to be created because it doesn't exist,
just use {} (empty) as the initial value. When reading the object, it has to set the
default value as I explained.

The JSON might have other options (like in this example). 
When updating it, make sure to keep the other options
{
  "vimMode": true,
  "attachmentFolderPath": "attachments",
  "newLinkFormat": "relative",
  "useMarkdownLinks": true,
  "strictLineBreaks": false
}

The configuration strictLineaBreaks configures the behavior in:
frontend/src/components/viewers/MarkdownViewer.jsx (conditionally added plugin for breaks)

