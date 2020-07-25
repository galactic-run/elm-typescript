module Gen.Types exposing (..)

import Dict exposing (Dict)
import Json.Decode as Decode
import Json.Encode as Encode


type alias Record =
    { string : String
    , int : Int
    , bool : Bool
    , listString : List String
    , dictInt : Dict String Int
    , maybeBool : Maybe Bool
    , otherRecord : OtherRecord
    }


recordDecoder : Decode.Decoder Record
recordDecoder =
    Decode.map7 Record
        (Decode.oneOf [ Decode.field "string" Decode.string ])
        (Decode.oneOf [ Decode.field "int" Decode.int ])
        (Decode.oneOf [ Decode.field "bool" Decode.bool ])
        (Decode.oneOf [ Decode.field "listString" (Decode.list Decode.string), Decode.succeed [] ])
        (Decode.oneOf [ Decode.field "dictInt" (Decode.dict Decode.int), Decode.succeed Dict.empty ])
        (Decode.oneOf [ Decode.field "maybeBool" (Decode.maybe Decode.bool), Decode.succeed Nothing ])
        (Decode.oneOf [ Decode.field "otherRecord" otherRecordDecoder ])


recordEncoder : Record -> Encode.Value
recordEncoder record =
    Encode.object
        [ ( "string", Encode.string record.string )
        , ( "int", Encode.int record.int )
        , ( "bool", Encode.bool record.bool )
        , ( "listString", Encode.list Encode.string record.listString )
        , ( "dictInt", Encode.dict identity Encode.int record.dictInt )
        , ( "maybeBool", Maybe.withDefault Encode.null <| Maybe.map Encode.bool <| record.maybeBool )
        , ( "otherRecord", otherRecordEncoder record.otherRecord )
        ]


type alias OtherRecord =
    { otherString : String
    }


otherRecordDecoder : Decode.Decoder OtherRecord
otherRecordDecoder =
    Decode.map OtherRecord
        (Decode.oneOf [ Decode.field "otherString" Decode.string ])


otherRecordEncoder : OtherRecord -> Encode.Value
otherRecordEncoder otherRecord =
    Encode.object
        [ ( "otherString", Encode.string otherRecord.otherString )
        ]


type alias User =
    { id : String
    , name : String
    }


userDecoder : Decode.Decoder User
userDecoder =
    Decode.map2 User
        (Decode.oneOf [ Decode.field "id" Decode.string ])
        (Decode.oneOf [ Decode.field "name" Decode.string ])


userEncoder : User -> Encode.Value
userEncoder user =
    Encode.object
        [ ( "id", Encode.string user.id )
        , ( "name", Encode.string user.name )
        ]


type Color
    = Red
    | Green
    | Blue
    | Yellow


colorEncoder : Color -> Encode.Value
colorEncoder color =
    case color of
        Red ->
            Encode.string "Red"

        Green ->
            Encode.string "Green"

        Blue ->
            Encode.string "Blue"

        Yellow ->
            Encode.string "Yellow"


colorDecoder : Decode.Decoder Color
colorDecoder =
    Decode.string
        |> Decode.andThen
            (\str ->
                case str of
                    "Red" ->
                        Decode.succeed Red

                    "Green" ->
                        Decode.succeed Green

                    "Blue" ->
                        Decode.succeed Blue

                    "Yellow" ->
                        Decode.succeed Yellow

                    unknown ->
                        Decode.fail <| "Unknown Color: " ++ unknown
            )


type alias LoginEvent =
    { username : String
    , password : String
    }


type alias LogoutEvent =
    { id : String
    , uid : String
    }


type Event
    = Login LoginEvent
    | Logout LogoutEvent


loginEventDecoder : Decode.Decoder LoginEvent
loginEventDecoder =
    Decode.map2 LoginEvent
        (Decode.oneOf [ Decode.field "username" Decode.string ])
        (Decode.oneOf [ Decode.field "password" Decode.string ])


loginEventEncoder : LoginEvent -> Encode.Value
loginEventEncoder loginEvent =
    Encode.object
        [ ( "username", Encode.string loginEvent.username )
        , ( "password", Encode.string loginEvent.password )
        ]


logoutEventDecoder : Decode.Decoder LogoutEvent
logoutEventDecoder =
    Decode.map2 LogoutEvent
        (Decode.oneOf [ Decode.field "id" Decode.string ])
        (Decode.oneOf [ Decode.field "uid" Decode.string ])


logoutEventEncoder : LogoutEvent -> Encode.Value
logoutEventEncoder logoutEvent =
    Encode.object
        [ ( "id", Encode.string logoutEvent.id )
        , ( "uid", Encode.string logoutEvent.uid )
        ]


eventDecoder : Decode.Decoder Event
eventDecoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\type_ ->
                case type_ of
                    "Login" ->
                        loginEventDecoder |> Decode.andThen (Decode.succeed << Login)

                    "Logout" ->
                        logoutEventDecoder |> Decode.andThen (Decode.succeed << Logout)

                    _ ->
                        Decode.fail <| "Unknown type " ++ type_
            )
