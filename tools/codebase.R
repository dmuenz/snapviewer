# Print the directory tree and file contents for all code files
# for the SnapViewer project
# -Daniel Muenz

# move to project root
setwd(this.path::this.proj())
proj <- basename(getwd())

cat_glue <- function(...) cat(glue::glue(..., .sep = "\n"), "\n", sep = "")

# text file in which to print directory tree and file contents
output_filename <- fs::path(this.path::this.dir(), "codebase.txt")

# open output file and redirect console output to it
output_file <- file(output_filename, open = "wt")
sink(output_file, type = "output")

# intro text mentioning currently checked out git branch
cat_glue(
  "This text file contains a copy of the entire codebase for the {proj} app.",
  "Specifically this is for the `{gert::git_branch()}` git branch.",
  "The app is a static web app hosted on GitHub Pages."
)

# regex to match extensions of relevant code files
include_exts <- "\\.(html|css|js|md)$"

# print directory tree, including only relevant files
cat_glue("\n\nHere is a tree-like view of the {proj} project folder, showing names of all relevant files and folders:\n\n")
withr::with_dir("..", {
  fs::dir_tree(path = proj, regexp = include_exts)
})

# all code files, with top-level files first
files <- fs::dir_ls(regexp = include_exts, recurse = TRUE)
files <- files[order(grepl("/", files, fixed = TRUE))]

# print file contents
cat("\nBelow, in fenced code blocks, are the contents of all the files:\n")
for (file in files) {
  cat_glue(
    "\n\nHere is the file `{file}`:",
    "```{fs::path_ext(file)}"
  )
  cat(readLines(file), sep = "\n")
  cat_glue("```")
}

# redirect output to console and close file
sink(type = "output")
close(output_file)
