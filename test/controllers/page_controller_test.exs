defmodule Fuego.PageControllerTest do
  use Fuego.ConnCase

  test "GET /" do
    conn = get conn(), "/"
    html_response(conn, 302)
  end

  test "GET /fire" do
    conn = get conn(), "/🔥"
    assert html_response(conn, 200) =~ "justHGH"
  end
end
