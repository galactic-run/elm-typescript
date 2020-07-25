port module Gen.Ports exposing (logout, subscribe, userFromElm)

import Gen.Types exposing (..)
import Json.Decode as Decode
import Json.Encode as Encode


port logoutPort : () -> Cmd msg


port userFromElmPort : Encode.Value -> Cmd msg


port userAuthenticatedSub : (Decode.Value -> msg) -> Sub msg


port userToElmSub : (Decode.Value -> msg) -> Sub msg


logout : () -> Cmd msg
logout =
    logoutPort


userFromElm : User -> Cmd msg
userFromElm =
    userFromElmPort << userEncoder


subscribe : { userAuthenticated : Result Decode.Error User -> msg, userToElm : Result Decode.Error User -> msg } -> Sub msg
subscribe subs =
    Sub.batch
        [ userAuthenticatedSub (Decode.decodeValue userDecoder >> subs.userAuthenticated)
        , userToElmSub (Decode.decodeValue userDecoder >> subs.userToElm)
        ]
