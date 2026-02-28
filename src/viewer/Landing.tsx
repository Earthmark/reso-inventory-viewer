import { Button, Container, Form } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { loadManifest, manifestError } from "../features/manifestSlice";
import { useCallback, useRef, useState } from "react";

function Landing() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadable, setLoadable] = useState(false);
  const err = useAppSelector(manifestError);

  const loadFile = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      return;
    }
    await dispatch(loadManifest(file));
  }, [dispatch]);

  const [copied, setCopied] = useState(false);

  const recordsCommand = "/requestRecordUsageJSON";

  return (
    <Container className="px-4 py-5 my-5 text-center">
      <h1 className="header text-center">Resonite Inventory Viewer</h1>
      <p className="text-center text-muted">
        By <a href="https://github.com/earthmark">Earthmark</a>
      </p>
      <p className="text-center">
        This is a third party tool, is not maintained by the resonite team, and
        may break at any time.
        <br />
      </p>
      <div className="card col-lg-6 mx-auto m-4">
        <div className="card-body">
          <h5 className="card-title">Getting Started</h5>
          <p>
            In Resonite, send the <b>Resonite</b> contact the message {" "}
            <div className="alert alert-secondary">
              {copied ? '✅' : '📋'}{" "}
              <em onClick={(e) => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.target as HTMLElement);
                selection?.removeAllRanges();
                selection?.addRange(range);
                setCopied(true);
                navigator.clipboard.writeText(recordsCommand);
              }}>{recordsCommand}</em>
            </div>
          </p>
          <p>
            Once the report is generated, it will be sent to the email address
            bound to the Resonite account in a zip file.
          </p>
          <div className="alert alert-secondary" role="alert">
            Every resonite user should have the Resonite contact already added.
          </div>
          <div className="alert alert-danger" role="alert">
            <p>
              The <em>RecordUsage.json</em> file can be used to spawn or
              download <b>anything</b> from your inventory or owned worlds,{" "}
              <b>without your consent or permission</b>.
            </p>
            <p>
              <b>Do not share this file with anyone</b>, including strange tools
              on the internet that claim to be safe.
            </p>
            <p>
              Have a trusted friend vet that this tool does not upload any part
              of the manifest to a remote server. The full source code is
              available on{" "}
              <a href="https://github.com/Earthmark/reso-inventory-viewer">
                Github
              </a>
              .
            </p>
          </div>
          <Form.Group controlId="formFile">
            <Form.Label>
              Load the json file from your email
            </Form.Label>
            <div className="input-group">
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={() =>
                  setLoadable((fileInputRef.current?.files?.length ?? 0) !== 0)
                }
              />
              <Button
                className="input-group-append"
                disabled={!loadable}
                onClick={() => loadFile()}
              >
                Load Records
              </Button>
            </div>
          </Form.Group>
          {err && (
            <div className="alert alert-danger mt-3" role="alert">
              {err}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export default Landing;
