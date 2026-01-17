import React from "react";
import {
  MenuItem,
  Spinner,
  HStack,
  Text,
  type MenuItemProps,
} from "@chakra-ui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";

/* hent prop‑typen direkte fra React‑PDF */
type PDFProps = React.ComponentProps<typeof PDFDownloadLink>;

type Props = Omit<MenuItemProps, "as" | "onClick"> & {
  /** Props som sendes videre til PDFDownloadLink */
  pdfProps: PDFProps;
};

/**
 * PdfMenuItem
 * -----------
 *  • Ytre <a> rendrer React‑PDF; vi putter en Chakra <MenuItem as="span"> inni.
 *  • Ingen refs sendes til PDFDownloadLink ⇒ advarselen forsvinner.
 *  • Ikke flere <a> i <a> ⇒ DOM‑nesting OK.
 */
export const PdfMenuItem: React.FC<Props> = ({ pdfProps, children, ...rest }) => (
  <PDFDownloadLink {...pdfProps} /* <a href="blob:…" … /> */>
    {({ loading, url }) => (
      <MenuItem
        /* bruk <span> for å unngå <button> i <a>  */
        as="span"
        /* visuelt disabled mens PDF lages */
        opacity={loading ? 0.5 : 1}
        pointerEvents={loading ? "none" : "auto"}
        /* lenke‑handling når klar */
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
        {...rest}
      >
        {loading ? (
          <HStack spacing={2}>
            <Spinner size="xs" />
            <Text>Lager&nbsp;PDF …</Text>
          </HStack>
        ) : (
          children
        )}
      </MenuItem>
    )}
  </PDFDownloadLink>
);

PdfMenuItem.displayName = "PdfMenuItem";
