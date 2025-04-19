import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { FormEvent, useCallback, useState } from "react";
import RxPlayer from "rx-player";
import { Label } from "../ui/label";
import { IKeySystemOption } from "rx-player/types";
import usePlayer from "./usePlayer";
import { Switch } from "../ui/switch";
import axios from "axios";
import { Textarea } from "../ui/textarea";

export default function Settings({
  setChallenge,
  setArrayBuffer,
}: {
  setChallenge: Function;
  setArrayBuffer: Function;
}) {
  const { player } = usePlayer();
  const [settings, setSettings] = useState<{
    url: string;
    transport: "dash" | "directfile";
    isEncrypted: boolean;
    licenseServerUrl: string;
    token: string;
    serverCertificateUrl: string;
    challengeType: string;
  }>({
    url: "https://d3-mhm-01gui.dev.mam.mediahub.aws.cplus/api/asset/v1/resources/757d6653-338f-42b5-95bc-91587b798def/stream",
    transport: "dash",
    isEncrypted: true,
    licenseServerUrl:
      "https://d3-mhm-01drm.dev.mam.mediahub.aws.cplus/licenses/757d6653-338f-42b5-95bc-91587b798def",
    token: "",
    serverCertificateUrl: "",
    challengeType: "Uint8Array",
  });
  const {
    url,
    transport,
    isEncrypted,
    licenseServerUrl,
    token,
    challengeType,
  } = settings;

  const getLicense = useCallback(
    (
      challenge: Uint8Array,
      messageType: string
    ): Promise<BufferSource | null> | BufferSource | null => {
      console.log("🚀 ~ getLicense ~ challenge:", challenge);
      console.log(
        "🚀 ~ getLicense ~ challenge: base64",
        Buffer.from(challenge).toString("base64")
      );
      console.log("🚀 ~ getLicense ~ messageType:", messageType);

      setChallenge({ message: challenge, messageType });
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", licenseServerUrl, true);
        if (!!token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
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
            console.log("reject");
            reject(error);
          }
        };
        xhr.responseType = "arraybuffer";

        // Send buffer in base64
        xhr.send(Buffer.from(challenge).toString("base64"));

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
          setArrayBuffer(arrayBuffer);
          const keySystems: IKeySystemOption[] = isEncrypted
            ? [
                {
                  type: "com.widevine.alpha",
                  getLicense,
                  serverCertificate: arrayBuffer,
                  persistentLicenseConfig: {
                    save(data: unknown) {
                      localStorage.setItem(
                        "RxPlayer-persistent-storage",
                        JSON.stringify(data)
                      );
                    },
                    load() {
                      const item = localStorage.getItem(
                        "RxPlayer-persistent-storage"
                      );
                      return item === null ? [] : JSON.parse(item);
                    },
                  },
                },
              ]
            : [];

          // play a video
          player?.loadVideo({
            url,
            manifestLoader: (urlManifest, { resolve, reject }) => {
              const sendingTime = Date.now();
              const accessToken = token;
              const authHeader = accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {};
              axios
                .get(urlManifest.url as string, {
                  headers: {
                    "Content-Type": "application/json",
                    ...authHeader,
                  },
                })
                .then((response) => {
                  return resolve({
                    data: response.data,
                    duration: Date.now() - sendingTime,
                    size: 0,
                  });
                })
                .catch((err) => {
                  return reject(err);
                });
            },
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
