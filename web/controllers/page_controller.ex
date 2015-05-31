defmodule Fuego.PageController do
  use Fuego.Web, :controller

  if Mix.env == :prod, do: plug :redirect_to_https

  def home(conn, _params) do
    render conn, "home.html"
  end

  # From Plug.SSL, modified
  defp redirect_to_https(conn, opts) do
    unless conn.scheme == :https do
      status = if conn.method in ~w(HEAD GET), do: 301, else: 307

      uri = %URI{scheme: "https", host: conn.host, path: full_path(conn), port: conn.port}

      conn
        |> put_resp_header("location", to_string(uri))
        |> send_resp(status, "")
        |> halt
    else
      conn
    end
  end

end
