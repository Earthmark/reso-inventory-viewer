import { Link, Route, Routes } from "react-router-dom";
import Overview from "./Overview";
import Records from "./Records";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Github, QuestionCircle } from "react-bootstrap-icons";

const Manifest = () => (
  <>
    <Navbar className="bg-body-tertiary">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Inventory Viewer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/records">
              Records
            </Nav.Link>
            <Nav.Link as={Link} to="/assets">
              Assets
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/about">
              <QuestionCircle />
            </Nav.Link>
            <Nav.Link href="https://github.com/Earthmark/reso-inventory-viewer">
              <Github />
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="/records" element={<Records />} />
    </Routes>
  </>
);

export default Manifest;
