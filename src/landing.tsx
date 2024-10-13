import { Container, Form } from "react-bootstrap";

function Landing() {
  return (
    <Container className="px-4 py-5 my-5 text-center">
      <h1 className="header text-center">Resonite Inventory Plotter</h1>
      <div className="col-lg-6 mx-auto">
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Default file input example</Form.Label>
          <Form.Control type="file" accept="application/json" />
        </Form.Group>
      </div>
    </Container>
  );
}

export default Landing;
