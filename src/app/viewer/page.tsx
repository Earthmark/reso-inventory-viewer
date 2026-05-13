"use client";

import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Github } from "react-bootstrap-icons";
import { Col, Row } from "react-bootstrap";
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
  }, []);

  return (
    <>
      <Navbar>
        <Container>
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
    </>
  );
}

export default Manifest;
