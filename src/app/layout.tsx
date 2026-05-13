'use client';

import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { store } from "../features/store";
import { Provider } from "react-redux";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <title>Resonite Inventory Plotter</title>
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <div id="root">
          <Provider store={store}>{children}</Provider>
        </div>
      </body>
    </html>
  );
}
