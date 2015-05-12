defmodule Fuego.StowTest do
  use ExUnit.Case
  alias Fuego.Stow

  test "it should be able to store and retrieve a value, once" do
    # get and stow into a token
    {:stowed, token} = Stow.put(:text, "cat")

    # works the first time
    assert {:ok, "text", "cat"} == Stow.get(token)

    # but not the second
    assert {:not_found} == Stow.get(token)
  end
end