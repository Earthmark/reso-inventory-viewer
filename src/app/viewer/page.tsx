"use client";

import Link from "next/link";
import { Card, Container, Nav, Navbar, Col, Row } from "react-bootstrap";
import { Github } from "react-bootstrap-icons";
import Overview from "./Overview";
import Records from "./Records";
import Renderer from "./Renderer";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/features/hooks";
import { manifestLoaded } from "@/src/features/manifestSlice";
import { useEffect } from "react";

function Manifest() {
  const router = useRouter();
  const currentlyLoaded = useAppSelector(manifestLoaded);
  useEffect(() => {
    if (!currentlyLoaded) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Fixed-height column so the records table can flex-grow to fill the
    // remaining space rather than relying on a hardcoded pixel height.
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container fluid>
          <Navbar.Brand as={Link} href="/">
            Inventory Viewer
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto" />
            <Nav>
              <Nav.Link href="https://github.com/Earthmark/reso-inventory-viewer">
                <Github />
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {/* Bootstrap's `.row` has negative left/right margins that compensate
          for a parent Container's padding. Without a Container wrapper the
          row overflows the viewport, producing an unwanted horizontal
          scrollbar on the body. */}
      <Container
        fluid
        className="px-3 pt-3"
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Row className="g-3">
          <Col xs={12} lg={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Overview />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={8}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-0">
                <Renderer />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* Separate row so it can flex-grow independently of the top panels. */}
        <Row className="g-3" style={{ flex: 1, minHeight: 0 }}>
          <Col xs={12} style={{ height: "100%" }}>
            <Records />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Manifest;
