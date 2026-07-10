# Create hex logo for SnapViewer, featuring a Polaroid photo of text and a
# graph, with a magnifying glass looking over the photo

setwd(this.path::this.dir())

hex_logo <- function() {
  require(ggplot2)
  require(ggforce)
  require(tibble)

  # -- Colors --
  bg_purple <- "#3d3670"
  white <- "#FFFFFF"
  light_purple <- "#7c6af7"

  # -- Helper: hex vertices --
  hex_points <- function(cx, cy, r, angle_offset = 30) {
    angles <- seq(angle_offset, 360 + angle_offset - 60, by = 60) * pi / 180
    data.frame(x = cx + r * cos(angles), y = cy + r * sin(angles))
  }

  hex_curve_rad <- 0.08

  # Outer hex (white border)
  outer_hex <- hex_points(0, 0, 1.0)

  # Inner hex (purple background)
  inner_hex <- hex_points(0, 0, 0.93)

  # -- Polaroid frame (as polygon for geom_shape rounding) --
  polaroid_w <- 0.9
  polaroid_h <- polaroid_w * 1.13

  polaroid_poly <- data.frame(
    x = polaroid_w / 2 * c(-1, 1, 1, -1),
    y = polaroid_h / 2 * c(-1, -1, 1, 1)
  )

  polaroid_bezel <- 0.07

  # Polaroid image area (dark inset)
  inset_size <- polaroid_w - 2 * polaroid_bezel

  inset <- tibble(
    xmax = inset_size / 2,
    xmin = -xmax,
    ymax = polaroid_h / 2 - polaroid_bezel,
    ymin = ymax - inset_size,
  )

  # -- Code lines (left side of inset) --
  code_width_fracs <- c(0.4, 0.6, 0.7, 0.5, 0.5)
  code_y_start <- inset$ymax - 0.08
  code_ys <- code_y_start - seq(0, 0.5 * (code_y_start - inset$ymin),
                                length.out = length(code_width_fracs))
  code_x_inset <- 0.06
  code_x_start <- inset$xmin + code_x_inset
  code_available_width <- inset_size - 2 * code_x_inset

  code_df <- data.frame(
    x    = code_x_start,
    xend = code_x_start + code_width_fracs * code_available_width,
    y    = code_ys
  )

  code_space_df <- tibble(
    y = rep(code_ys, times = c(1, 2, 2, 1, 1)),
    x = code_x_start + c(0.15, 0.3, 0.4, 0.15, 0.6, 0.2, 0.1) * code_available_width,
    xend = x + 0.05 * code_available_width
  )

  # -- Bar chart (right side of inset) --
  bar_xs <- seq(0.08, 0.3, length.out = 4)
  bar_heights <- c(0.12, 0.20, 0.16, 0.24)
  bar_bottom <- inset$ymin + 0.05
  bar_width <- 0.035

  bars_df <- data.frame(
    xmin = bar_xs - bar_width / 2,
    xmax = bar_xs + bar_width / 2,
    ymin = bar_bottom,
    ymax = bar_bottom + bar_heights
  )

  # -- Line graph --
  line_df <- data.frame(
    x = bar_xs,
    y = bar_bottom + bar_heights + 0.06
  )

  # -- Magnifying glass --
  lens_cx <- 0.18
  lens_cy <- -0.1
  lens_r <- 0.25

  handle_angle <- -32 * pi / 180
  handle_offset <- 0.08
  handle_len <- 0.25
  handle_start_x <- lens_cx + lens_r * (1 + handle_offset) * cos(handle_angle)
  handle_start_y <- lens_cy + lens_r * (1 + handle_offset) * sin(handle_angle)
  handle_end_x <- handle_start_x + handle_len * cos(handle_angle)
  handle_end_y <- handle_start_y + handle_len * sin(handle_angle)

  handle_df <- data.frame(
    x = c(handle_start_x, handle_end_x),
    y = c(handle_start_y, handle_end_y)
  )

  # -- Build the plot --
  ggplot() +
    geom_shape(
      data = outer_hex, aes(x = x, y = y),
      fill = white, color = grey(0.7),
      radius = unit(hex_curve_rad, "npc")
    ) +
    geom_shape(
      data = inner_hex, aes(x = x, y = y),
      fill = bg_purple, color = NA,
      radius = unit(hex_curve_rad, "npc")
    ) +
    geom_shape(
      data = polaroid_poly, aes(x = x, y = y),
      fill = white, color = NA,
      radius = unit(0.03, "npc")
    ) +
    geom_rect(
      data = inset,
      aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = bg_purple, color = NA
    ) +
    geom_segment(
      data = code_df,
      aes(x = x, xend = xend, y = y),
      color = white, linewidth = 1.5
    ) +
    geom_segment(
      data = code_space_df,
      aes(x = x, xend = xend, y = y),
      color = bg_purple, linewidth = 1.6
    ) +
    geom_rect(
      data = bars_df,
      aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = white, color = NA
    ) +
    geom_line(
      data = line_df, aes(x = x, y = y),
      color = white, linewidth = 1.2
    ) +
    geom_point(
      data = line_df, aes(x = x, y = y),
      color = white
    ) +
    geom_circle(
      aes(x0 = lens_cx, y0 = lens_cy, r = lens_r),
      fill = scales::alpha(white, 0.3),
      color = bg_purple, linewidth = 5
    ) +
    geom_line(
      data = handle_df, aes(x = x, y = y),
      color = bg_purple, linewidth = 6, lineend = "round"
    ) +
    geom_circle(
      aes(x0 = lens_cx, y0 = lens_cy, r = lens_r),
      color = white, linewidth = 3
    ) +
    geom_line(
      data = handle_df, aes(x = x, y = y),
      color = white, linewidth = 4, lineend = "round"
    ) +
    coord_fixed(xlim = c(-1, 1), ylim = c(-1, 1), expand = FALSE) +
    # theme_bw() +
    theme_void() +
    theme(
      plot.background = element_rect(fill = "transparent", color = NA),
      panel.background = element_rect(fill = "transparent", color = NA),
      plot.margin = margin(0, 0, 0, 0),
      axis.title = element_blank()
    )
}

p <- hex_logo()
p

ggsave("logo.svg", p, width = 2.73, height = 3, bg = "transparent")

