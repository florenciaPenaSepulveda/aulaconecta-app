import { gql } from "@apollo/client";
import client from "./apollo";
import { onSessionExpired, setCurrentToken } from "./lib/session";

const responder = (cuerpo: unknown) =>
  jest.spyOn(globalThis, "fetch").mockImplementation((async () => {
    const texto = JSON.stringify(cuerpo);
    return { ok: true, status: 200, headers: { get: () => "application/json" }, text: async () => texto, json: async () => cuerpo };
  }) as unknown as typeof fetch);

const consulta = gql`
  query ListCourses {
    listCourses {
      id
    }
  }
`;

describe("cliente de la API", () => {
  afterEach(() => {
    setCurrentToken(null);
    return client.clearStore();
  });

  it("envía el token de la sesión en la cabecera Authorization", async () => {
    setCurrentToken("jwt-de-prueba");
    const fetchMock = responder({ data: { listCourses: [] } });
    await client.query({ query: consulta, fetchPolicy: "network-only" });
    const cabeceras = (fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers;
    expect(cabeceras.authorization).toBe("Bearer jwt-de-prueba");
  });

  it("avisa que la sesión expiró cuando el servidor rechaza el token", async () => {
    const oyente = jest.fn();
    const baja = onSessionExpired(oyente);
    responder({ errors: [{ message: "Token is invalid or expired", extensions: { code: "UNAUTHENTICATED" } }] });
    await client.query({ query: consulta, fetchPolicy: "network-only", errorPolicy: "all" });
    expect(oyente).toHaveBeenCalledTimes(1);
    baja();
  });

  it("no cierra la sesión por otros errores", async () => {
    const oyente = jest.fn();
    const baja = onSessionExpired(oyente);
    responder({ errors: [{ message: "No tienes permisos para realizar esta acción", extensions: { code: "FORBIDDEN" } }] });
    await client.query({ query: consulta, fetchPolicy: "network-only", errorPolicy: "all" });
    expect(oyente).not.toHaveBeenCalled();
    baja();
  });
});
