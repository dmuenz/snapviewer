# 📷 SnapViewer
[SnapViewer](https://dmuenz.github.io/snapviewer/) is a simple file browser and viewer for [testthat](https://testthat.r-lib.org/) snapshots. You point it to a `_snaps` folder in an R package on your computer, and it shows a list of all snapshot files, e.g. `.md` files created via `expect_snapshot()` and `.svg` files created via `vdiffr::expect_doppelganger()`. Click any file to view it.

You can point SnapViewer to the `_snaps` folders for multiple packages, and you can easily toggle between them. SnapViewer will remember all previously accessed `_snaps` folders across browsing sessions.
