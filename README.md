# SnapViewer <img src="favicon/logo.svg" align="right" height="150"/>
[SnapViewer](https://dmuenz.github.io/snapviewer/) is a simple and _fast_ web app for viewing [testthat](https://testthat.r-lib.org/) snapshots in an R package. You point the app to the package's snapshot folder on your computer and it shows a list of all snapshot files. Select any file to view it.

SnapViewer loads files very quickly, making it a breeze to click through and review many snapshot files. SnapViewer displays Markdown files and SVG image files, created for example via [`expect_snapshot()`](https://testthat.r-lib.org/reference/expect_snapshot.html) and [`vdiffr::expect_doppelganger()`](https://vdiffr.r-lib.org/reference/expect_doppelganger.html). A toggle lets you easily switch between viewing files in "visual mode" versus raw text mode.

You can point SnapViewer to the snapshot folders for multiple packages, and easily switch between them. SnapViewer remembers all previously accessed folders across browsing sessions. These features rely on an  experimental JavaScript method ([showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)) which is implemented in Chrome and Edge but not in Firefox or Safari. So use Chrome or Edge for best compatibility.

## Finding the snapshot folder

If your R package is named `package`, then the snapshot folder (if it exists) is `package/tests/testthat/_snaps`. You can equivalently point SnapViewer to any of the following folders, and in any case it will find the `_snaps` folder:

- `package`
- `package/tests`
- `package/tests/testthat`
- `package/tests/testthat/_snaps`

Selecting the root `package` folder is best because then SnapViewer knows the package name and suggests this as a nickname for labeling the snapshot folder within the app. Otherwise you can type in your own nickname.
