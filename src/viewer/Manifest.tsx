import { Link, Route, Routes } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Github, QuestionCircle } from "react-bootstrap-icons";
import About from "./About";
import Viewer from "./Viewer";

const Manifest = () => (
  <>
    <Navbar>
      <Container>
        <Navbar.Brand as={Link} to="/">
          Inventory Viewer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto" />
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
    <Container>
      <Routes>
        <Route path="/*" element={<Viewer />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Container>
  </>
);

export default Manifest;
