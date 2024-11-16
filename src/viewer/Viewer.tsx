import { Col, Row } from "react-bootstrap";
import Overview from "./Overview";
import Records from "./Records";
import Renderer from "./Renderer";

const Viewer = () => (
  <Row xs="5" className="gx-5">
    <Col xs="12" lg="4">
      <Overview />
    </Col>
    <Col xs="12" lg="8">
      <Renderer />
    </Col>
    <Col xs="12">
      <Records />
    </Col>
  </Row>
);

export default Viewer;
