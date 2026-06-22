# Print the directory tree and file contents for all code files
# for the SnapViewer project
# -Daniel Muenz

# move to project root
setwd(this.path::this.dir())
setwd("..")

cat_glue <- function(...) cat(glue::glue(...), "\n", sep = "")

# all code files
files <- fs::dir_ls(regexp = "\\.(|md|css|js)$", recurse = TRUE)

# text file in which to print directory tree and file contents
output_filename <- fs::path(this.path::this.dir(), "codebase.txt")

# open output file and redirect console output to it
output_file <- file(output_filename, open = "wt")
sink(output_file, type = "output")

# print directory tree, including only relevant files
cat("Here is a list of all the relevant file names:\n")
fs::dir_tree(regexp = "\\.(|md|css|js)$")

# print file contents
cat("\nAnd here are all the file contents:\n")
for (file in files) {
  cat("\n")
  cat_glue("File `{file}`:")
  cat_glue("```{fs::path_ext(file)}")
  cat(readLines(file), sep = "\n")
  cat_glue("```")
}

# redirect output to console and close file
sink(type = "output")
close(output_file)
