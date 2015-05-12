defmodule Fuego.NoteController do
  use Fuego.Web, :controller
  alias Fuego.Stow

  plug :no_bots
  plug :action

  def new(conn, _params) do
    render conn, "new.html"
  end

  def create(conn, %{"message" => message}) do
    {:stowed, tkn} = Stow.put(:text, message)

    render conn, "create.html", tkn: tkn, message: message
  end

  def show(conn, %{"tkn" => tkn}) do
    res = Stow.get(tkn)

    case res do
      {:not_found} ->
        render %{conn| status: 404}, "missing.html"
      {:ok, "text", message} ->
        render conn, "show.html", message: message
    end
  end

  defp no_bots(conn, _opts) do
    user_agent = conn |> Plug.Conn.get_req_header("user-agent") |> List.first
    bot_regex = ~r/http|bot/i

    if user_agent && user_agent =~ bot_regex do
      conn
        |> put_resp_content_type("text/plain")
        |> send_resp(400, "No bots allowed.")
        |> halt
    else
      conn
    end
  end
end