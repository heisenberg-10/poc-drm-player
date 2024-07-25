import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { FormEvent, useCallback, useState } from "react";
import RxPlayer from "rx-player";
import SourceBufferManager from "rx-player/core";
import { Label } from "../ui/label";
import { IKeySystemOption } from "rx-player/types";
import usePlayer from "./usePlayer";

export default function Settings({ setChallenge }: { setChallenge: Function }) {
  const { player } = usePlayer();
  const [settings, setSettings] = useState<{
    url: string;
    transport: "dash" | "directfile";
    isEncrypted: boolean;
    licenseServerUrl: string;
    token: string;
    serverCertificateUrl: string;
  }>({
    url: "https://replay-dshmkpc.p-cdnvod-edge010605-dual.scy.canalplus-cdn.net/__token__id%3D248be0ca7687389c22da7245f4fb4b6b~hmac%3D85516461bc32e8a8b13b56ef05eea066eb495c48c887806be42ec89aff461bb5/wal/mkpc/canalplus/canalplus/ANT_1287096_1/01HYYSGMSDT9NA2B7PMAJMXJYS/ANT_1287096_1.mpd",
    transport: "dash",
    isEncrypted: true,
    licenseServerUrl: "",
    token: "",
    serverCertificateUrl: "",
  });
  const { url, transport, isEncrypted, licenseServerUrl, token } = settings;

  const getLicense = useCallback(
    (
      challenge: Uint8Array,
      messageType: string
    ): Promise<BufferSource | null> | BufferSource | null => {
      console.log("🚀 ~ getLicense ~ challenge:", challenge);
      console.log("🚀 ~ getLicense ~ messageType:", messageType);

      setChallenge({ message: challenge, messageType });
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (!!token) {
          xhr.setRequestHeader("Authorization", token);
        }
        xhr.open("POST", licenseServerUrl, true);
        xhr.onerror = (err) => {
          reject(err);
        };
        xhr.onload = (evt: any) => {
          console.log("🚀 ~ returnnewPromise ~ xhr.status:", xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            const license = evt?.target?.response;
            const buf = license;
            const decoder = new TextDecoder();
            const str = decoder.decode(buf);
            console.log("🚀 ~ returnnewPromise ~ license:", str);
            resolve(license);
          } else {
            const error = new Error(
              "getLicense's request finished with a " +
                `${xhr.status} HTTP error`
            );
            reject(error);
          }
        };
        xhr.responseType = "arraybuffer";
        console.log("send");
        xhr.send(challenge);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == XMLHttpRequest.DONE) {
            console.log("🚀 ~ returnnewPromise ~ xhr:", xhr);
            // alert(xhr?.responseText);
          }
        };
      });
    },
    [setChallenge, licenseServerUrl, token]
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // const reader = new FileReader()
      // reader.readAsDataURL("https://secure-webtv-static.canal-plus.com/widevine/cert/cert_license_widevine_com.bin")
      // reader.readAsArrayBuffer("https://secure-webtv-static.canal-plus.com/widevine/cert/cert_license_widevine_com.bin");

      fetch(
        "https://secure-webtv-static.canal-plus.com/widevine/cert/cert_license_widevine_com.bin"
      )
        .then((res) => res.arrayBuffer())
        .then((arrayBuffer) => {
          const keySystems: IKeySystemOption[] = isEncrypted
            ? [
                {
                  type: "com.widevine.alpha",
                  getLicense,
                  serverCertificate: arrayBuffer,
                },
              ]
            : [];

          // play a video
          player?.loadVideo({
            url,
            transport,
            autoPlay: true,
            keySystems,
          });
        });
    },
    [url, transport, isEncrypted, player, getLicense]
  );

  return player ? (
    <form className="flex flex-col gap-[8px]" onSubmit={onSubmit}>
      <div className="flex gap-[8px] mb-[8px] items-center">
        <Label>Choose your transport method : </Label>
        <Toggle
          onClick={() => {
            setSettings((prevState) => ({
              ...prevState,
              transport: "dash",
              url: !isEncrypted
                ? "https://www.bok.net/dash/tears_of_steel/cleartext/stream.mpd"
                : "",
            }));
          }}
          pressed={transport === "dash"}
        >
          Dash
        </Toggle>
        <Toggle
          onClick={() => {
            setSettings((prevState) => ({
              ...prevState,
              transport: "directfile",
              url: !isEncrypted ? "test.mp4" : "",
            }));
          }}
          pressed={transport === "directfile"}
        >
          DirectFile
        </Toggle>
      </div>
      <div className="flex flex-col gap-[8px]">
        <Input
          onChange={(e) =>
            setSettings((prevState) => ({
              ...prevState,
              licenseServerUrl: e.target.value,
            }))
          }
          value={licenseServerUrl}
          placeholder={`Set license url...`}
        />
      </div>
      <div className="flex gap-[8px] items-center mt-5">
        <Label>Token:</Label>
        <Input
          onChange={(e) =>
            setSettings((prevState) => ({
              ...prevState,
              token: e.target.value,
            }))
          }
          value={token}
          placeholder={`Bearer ...`}
        />
      </div>
      <div className="flex gap-[8px] items-center mt-5">
        <Label>Url:</Label>
        <Input
          onChange={(e) =>
            setSettings((prevState) => ({ ...prevState, url: e.target.value }))
          }
          value={url}
          placeholder={`Set an ${
            transport === "dash" ? "manifest.mdp" : ".mp4"
          } url...`}
        />
        <Button type="submit">Load video</Button>
      </div>
    </form>
  ) : null;
}
