import { Box, BoxProps } from "@mui/material";
import React from "react";

export default function ResourceItem({ sx = {}, ...other }: BoxProps) {
  return (
    <Box
      component="li"
      sx={{
        mb: "1.5rem",
        paddingBottom: "0.88rem",
        borderBottom: "0.0625rem solid #A9ABBD",
        listStyle: "none",
        ...sx,
      }}
      {...other}
    />
  );
}
