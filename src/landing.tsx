import { Container, Form } from "react-bootstrap";
import { useAppDispatch } from "./app/hooks";
import { loadManifest } from "./features/manifestSlice";

function Landing() {
  const dispatch = useAppDispatch();

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", (loadEvent) => {
      const manifest = JSON.parse((loadEvent.target as any).result);
      dispatch(loadManifest(manifest));
    });
    reader.readAsText(file);
  };

  return (
    <Container className="px-4 py-5 my-5 text-center">
      <h1 className="header text-center">Resonite Inventory Plotter</h1>
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
            In Resonite, send the <b>Resonite</b> contact the message{" "}
            <em>/requestRecordUsageJSON</em>
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
              Load the json file from <em>/requestRecordUsageJSON</em>
            </Form.Label>
            <Form.Control
              type="file"
              accept="application/json"
              onChange={(e) =>
                loadFile((e.target as any as { files: File[] }).files[0])
              }
            />
          </Form.Group>
        </div>
      </div>
    </Container>
  );
}

export default Landing;
