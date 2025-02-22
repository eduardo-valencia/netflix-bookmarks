import { AppBar, BoxProps, Toolbar } from "@mui/material";
import PageContainer from "../PageContainer";
import Search from "./Search";

export function Layout({ sx, ...other }: BoxProps): JSX.Element {
  return (
    <>
      <AppBar
        color="transparent"
        sx={{
          boxShadow: "none",
          py: "1rem",
          marginTop: "1.1875rem",
          marginBottom: "1.6875rem",
        }}
        position="static"
      >
        <Toolbar>
          <Search />
        </Toolbar>
      </AppBar>
      <PageContainer {...other}></PageContainer>
    </>
  );
}
