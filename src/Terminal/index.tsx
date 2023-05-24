import "./terminal.css";
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { render } from "react-dom";
import { TerminalProps } from "./types";
import { useTerminal } from "./hooks";
import { paths } from "./paths";
import Typed from "react-typed";
import { encrypt, nonce } from "solana-encryption";
import axios from "axios";

export const Terminal = forwardRef(
  (props: TerminalProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { history, pushToHistory, setTerminalRef, resetTerminal } =
      useTerminal();

    const {
      promptLabel = ">",

      commands = {},
    } = props;

    const terminalRef = useRef(null);
    const inputRef = useRef<HTMLInputElement>();
    const [input, setInputValue] = useState<string>("");
    const [pathIndex, setIndexValue] = useState<number>(0);
    const [email, setEmail] = useState("");

    /**
     * Focus on the input whenever we render the terminal or click in the terminal
     */
    useEffect(() => {
      inputRef.current?.focus();
    });

    const focusInput = useCallback(() => {
      console.log("ran focusInput");
      // console.log("responses are ", responses);
      // setResponses((prev_responses) => [...prev_responses, "test"]);
      inputRef.current?.focus();
    }, []);

    /**
     * When user types something, we update the input value
     */
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
      },
      []
    );

    // const handleInput = async (commands, input) => {
    //   const commandToExecute = commands?.[input.toLowerCase()];
    //   if (commandToExecute) {
    //     commandToExecute?.();
    //   }
    //   setInputValue('');
    // }
    /**
     * When user presses enter, we execute the command
     */
    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          // then, parse the text input, and try to resolve a next reply
          console.log("input is", input);
          let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          if (input.match(regex)) {
            setEmail(input);
          }
          if ("clear" == input.toLowerCase()) {
            resetTerminal();
            setInputValue("");
          } else {
            pushToHistory(
              [{ script: input as string, className: "userResponse" }],
              focusInput
            );

            console.log("email", email);


            if (email) {

            const message = email;

            const newNonce = nonce();

            const publicKey_receiver =
              process.env.REACT_APP_TASK_CREATOR_PUBLIC_KEY;

            const publicKey_sender = process.env.REACT_APP_TASK_SENDER_PUBLIC_KEY;
            const privateKey_sender = new Uint8Array(
              (process.env.REACT_APP_TASK_CREATOR_PRIVATE_KEY || "")
                .split(",")
                .map(Number)
            );

            const encryptedMessage = encrypt(
              message,
              newNonce,
              publicKey_receiver,
              privateKey_sender
            );

            const payload = {
              encrypted: encryptedMessage,
              nonce: newNonce,
              publicKey: publicKey_sender,
            };

            console.log("payload is ", payload);

            const response = sendEmail(payload);

            console.log(response);

            }

            console.log("paths are ", paths, paths[0]);
            console.log("pathIndex is ", pathIndex);
            try {
              console.log("about to set index, index is ", pathIndex);
              let newIndex = paths[pathIndex].parseAnswer(input);
              setInputValue("");
              console.log("newIndex will be", newIndex);
              setIndexValue(newIndex);
              console.log("pathIndex is ", pathIndex);
              let newPrompt = generatePathBlock(newIndex);
              console.log("new is ", newPrompt);
              pushToHistory(newPrompt, focusInput);
              setTimeout(() => {
                console.log("will try to run focusInput");
                focusInput();
              }, 100);
            } catch (err) {
              console.error("Error parsing answer, no change to path");
            }
          }
        }
      },
      [commands, input]
    );

    async function sendEmail(payload: any) {
      // TODO replace with tasknet REST API
      const response = await axios.post("http://192.168.2.41:10000/contact", {
        payload,
      });
      return response;
    }

    const generatePathBlock = (pathIndex: any) => {
      return [
        {
          script: `${paths[pathIndex].response}`,
          className: "pathblock_response",
        },
        {
          script: `${paths[pathIndex].question}`,
          className: "pathblock_question",
        },
      ];
    };

    return (
      <>
        <div className="terminal_bg"></div>
        <div className="terminal" ref={terminalRef} onClick={focusInput}>
          <div className="terminal__line">
            <div className="pathBlock">
              <Typed
                typeSpeed={40}
                className="pathBlock__response"
                strings={[paths[pathIndex].response, paths[pathIndex].question]}
              ></Typed>
            </div>
          </div>
          {history.map((line, index) => (
            <div
              className="terminal__line"
              key={`terminal-line-${index}-${line}`}
            >
              {line}
            </div>
          ))}
          <div className="terminal__prompt">
            <div className="terminal__prompt__label">{promptLabel}</div>
            <div className="terminal__prompt__input">
              <input
                type="text"
                value={input}
                onKeyDown={handleInputKeyDown}
                onChange={handleInputChange}
                // @ts-ignore
                ref={inputRef}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
);
