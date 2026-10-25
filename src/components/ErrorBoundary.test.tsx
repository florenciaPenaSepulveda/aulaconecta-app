import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import ErrorBoundary from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("muestra el contenido cuando no hay errores", async () => {
    await render(
      <ErrorBoundary>
        <></>
      </ErrorBoundary>,
    );
    expect(screen.queryByText("Algo salió mal")).toBeNull();
  });

  it("muestra un mensaje y permite reintentar cuando algo falla", async () => {
    let fallar = true;
    const Roto = () => {
      if (fallar) {
        throw new Error("falla de prueba");
      }
      return null;
    };
    const alReintentar = jest.fn();
    await render(
      <ErrorBoundary onReload={alReintentar}>
        <Roto />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Algo salió mal")).toBeTruthy();
    fallar = false;
    await fireEvent.press(screen.getByText("Reintentar"));
    expect(alReintentar).toHaveBeenCalled();
    expect(screen.queryByText("Algo salió mal")).toBeNull();
  });
});
