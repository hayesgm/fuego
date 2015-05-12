defmodule Fuego.NoteControllerTest do
  use Fuego.ConnCase
  alias Fuego.Stow

  test "POST note" do
    conn = post conn(), "/🔥", %{message: "hello ma"}
    assert html_response(conn, 200) =~ "Your note was created"
  end

  test "GET actual note" do
    {:stowed, tkn} = Stow.put(:text, "jibber jabber")

    conn = get conn(), "/🔥/#{tkn}"
    assert html_response(conn, 200) =~ "jibber jabber"
  end

  test "GET via bot" do
    {:stowed, tkn} = Stow.put(:text, "jibber jabber")

    conn = get %{conn| req_headers: [{"user-agent","some bot"}]}, "/🔥/#{tkn}"
    assert text_response(conn, 400) =~ "No bots allowed."
  end

  test "GET burned note" do
    {:stowed, tkn} = Stow.put(:text, "...")
    {:ok, _, _} = Stow.get(tkn)
    {:not_found} = Stow.get(tkn)

    conn = get conn(), "/🔥/#{tkn}"
    assert html_response(conn, 404) =~ "Didn't find"
  end
end
