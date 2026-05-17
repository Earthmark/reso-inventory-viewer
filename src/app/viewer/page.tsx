"use client";

import Link from "next/link";
import { Container, Nav, Navbar, Col, Row } from "react-bootstrap";
import { Github } from "react-bootstrap-icons";
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
  }, [currentlyLoaded, router]);

  return (
    // vh-100 + d-flex flex-column: standard Bootstrap pattern for a
    // full-viewport-height page that doesn't body-scroll.
    <div className="d-flex flex-column vh-100">
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

      {/* Bootstrap's .row has negative left/right margins that compensate
          for a Container's horizontal padding. Without a Container wrapper
          the row overflows the viewport and causes a horizontal scrollbar. */}
      <Container
        fluid
        className="d-flex flex-column flex-grow-1 py-3"
        style={{ minHeight: 0 }}  // flex children won't shrink below content without this
      >
        {/* Graph row — natural height set by the Renderer's minHeight. */}
        <Row className="mb-2">
          <Col xs={12}>
            <Renderer />
          </Col>
        </Row>

        {/* Records row — flex-grow-1 fills whatever height the graph leaves.
            minHeight: 0 is required so the row can shrink below its content
            height (a CSS flex quirk Bootstrap has no utility class for). */}
        <Row className="flex-grow-1" style={{ minHeight: 0 }}>
          <Col xs={12} className="h-100">
            <Records />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Manifest;
