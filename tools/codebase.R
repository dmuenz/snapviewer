# Print the directory tree and file contents for all 1st-party code files
# for the SnapViewer project. The output is chunked and saved into text files,
# each of at most 50,000 characters.
# -Daniel Muenz

this_dir <- this.path::this.dir()

# move to project root
setwd(this.path::this.proj())
proj <- basename(getwd())

cat_glue <- function(..., .env = parent.frame()) {
  cat(glue::glue(..., .sep = "\n", .envir = .env), "\n", sep = "")
}

# chunk a character vector into strings whose total width stays under max_char
chunk_by_nchar <- function(x, max_char, sep = "") {
  stopifnot(is.character(x), length(max_char) == 1, max_char >= 1)

  y <- character()
  current <- ""

  for (s in x) {
    # candidate if we append s to current chunk
    candidate <- if (current == "") s else paste0(current, sep, s)

    if (nchar(candidate) < max_char) {
      current <- candidate
    } else {
      # flush current chunk (if non-empty)
      if (current != "") y <- c(y, current)

      # start new chunk with s (even if s itself is too long)
      current <- s
    }
  }

  # flush final chunk
  if (current != "") y <- c(y, current)

  y
}

intro <- capture.output({
  # intro text mentioning currently checked out git branch
  cat_glue(
    "Here is a copy of all the 1st-party code for a static web app called SnapViewer.
    * The app is a tool to help R package developers easily view their unit testing snapshot files created by testthat.
    * The app is hosted on GitHub Pages.
    * Specifically the code shown here is for the `{gert::git_branch()}` git branch.

    Here is a tree-like view of the {proj} project folder, showing names of all files and folders:

    ```text"
  )

  # print directory tree, including only relevant files
  withr::with_dir("..", {
    fs::dir_tree(path = proj, regexp = "^(?!snapviewer/tools/).+\\..+$",
                 perl = TRUE)
  })

  cat_glue(
    "```

    Below, in fenced code blocks, are the contents of all the 1st-party code and markdown files.
    Code in the `vendor` folder, from 3rd-party vendors, is not shown, but the `vendor/README.md` file describes the origin and purpose of this code.
    "
  )
}) |> paste(collapse = "\n")

# all 1st-party code files, with top-level files first
files <- fs::dir_ls(regexp = "\\.(html|css|js|md)$", recurse = TRUE)
files <- files[!grepl("^vendor/.*/", files)]
files <- files[order(grepl("/", files, fixed = TRUE))]

# print file contents
file_contents <- sapply(files, \(file) {
  capture.output({
    cat_glue(
      "

      Here is the file `{file}`:
      ```{fs::path_ext(file)}"
    )
    cat(readLines(file), sep = "\n")
    cat_glue("```")
  }) |> paste(collapse = "\n")
})

all <- chunk_by_nchar(
  c(intro, file_contents, "\nOK, that's the complete 1st-party codebase."),
  max_char = 50000,
  sep = "\n"
)

all[-length(all)] <- paste0(
  all[-length(all)],
  "\n\nDon't do anything yet -- I'm still copying over more code."
)

cat_glue("There will be {length(all)} files with the following lengths:
         {paste(nchar(all), collapse = ', ')}")

withr::with_dir(this_dir, {
  old_files <- list.files(pattern = "^codebase_\\d+\\.txt$")
  file.remove(old_files)

  for (i in seq_along(all)) {
    writeLines(
      text     = enc2utf8(all[i]),
      con      = sprintf("codebase_%02d.txt", i),
      useBytes = TRUE
    )
  }
})
