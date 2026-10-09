"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  SpaceBetween,
  Button,
  Container,
  Header,
  FormField,
  Input,
  Textarea,
  RadioGroup,
  Alert,
  Link
} from "@cloudscape-design/components";
import ConsoleLayout from "@/components/ConsoleLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreateHostedZone() {
  const router = useRouter();
  
  // Form State
  const [domainName, setDomainName] = useState("");
  const [description, setDescription] = useState("");
  const [zoneType, setZoneType] = useState("public");
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [domainError, setDomainError] = useState(""); // Dedicated state for inline input error

  // Domain Validation Function
  const isValidDomain = (domain: string) => {
    // 1. Check max length (AWS limit is 255 chars)
    if (domain.length > 255) return false;
    
    // 2. Regex for strict domain validation
    // - allows subdomains (a.b.com)
    // - ensures labels only contain a-z, 0-9, and hyphens (but not at start/end of a label)
    // - ensures TLD is alphabetical and at least 2 chars long
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
    
    return domainRegex.test(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setDomainError(""); // Reset inline error

    // Basic frontend validation
    const trimmedDomain = domainName.trim();
    if (!trimmedDomain) {
      setDomainError("Domain name is required.");
      return;
    }

    if (!isValidDomain(trimmedDomain)) {
      setDomainError("Invalid domain name format. Valid characters are a-z, 0-9, and - (hyphen). Must include a valid top-level domain (e.g., example.com).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Connects to your FastAPI backend
      const response = await fetch(`${API_BASE_URL}/api/hosted-zones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedDomain, // Send the cleaned domain name
          comment: description,
          zone_type: zoneType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create hosted zone.");
      }

      const newZone = await response.json();
      
      // On success, redirect to the specific zone details page
      router.push(`/hosted-zones/${newZone.id}`);
      
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout
      activeHref="/hosted-zones"
      pageTitle="Create hosted zone"
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Hosted zones", href: "/hosted-zones" },
        { text: "Create hosted zone", href: "/hosted-zones/create" },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link" onClick={() => router.push("/hosted-zones")}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                Create hosted zone
              </Button>
            </SpaceBetween>
          }
          errorText={errorMessage} // General API errors show up at the bottom
        >
          <SpaceBetween size="l">
            
            <Container
              header={
                <Header 
                  variant="h2" 
                  description="A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain, such as example.com, and its subdomains (acme.example.com, zenith.example.com)."
                >
                  Hosted zone configuration
                </Header>
              }
            >
              <SpaceBetween size="l">
                
                {/* Domain Name Field */}
                <FormField
                  label="Domain name"
                  description="Enter the name of the domain. For example, example.com."
                  info={<Link variant="info">Info</Link>}
                  constraintText="Maximum of 255 characters. Valid characters are a-z, 0-9, and - (hyphen)."
                  errorText={domainError} // Shows inline red text right beneath the input if validation fails
                >
                  <Input
                    value={domainName}
                    onChange={({ detail }) => {
                      setDomainName(detail.value);
                      if (domainError) setDomainError(""); // Clear error when user starts typing again
                    }}
                    placeholder="example.com"
                  />
                </FormField>

                {/* Description Field */}
                <FormField
                  label={
                    <span>
                      Description - <i>optional</i>
                    </span>
                  }
                  description="Enter a description for the hosted zone."
                  constraintText="Maximum of 256 characters."
                >
                  <Textarea
                    value={description}
                    onChange={({ detail }) => setDescription(detail.value)}
                    placeholder="Description"
                    rows={3}
                  />
                </FormField>

                {/* Zone Type Selection */}
                <FormField
                  label="Type"
                  stretch={true}
                >
                  <RadioGroup
                    onChange={({ detail }) => setZoneType(detail.value)}
                    value={zoneType}
                    items={[
                      {
                        value: "public",
                        label: "Public hosted zone",
                        description: "Determines how traffic is routed on the internet.",
                      },
                      {
                        value: "private",
                        label: "Private hosted zone",
                        description: "Determines how traffic is routed within one or more Amazon VPCs.",
                      },
                    ]}
                  />
                </FormField>

                {/* Optional conditional UI for Private Hosted Zones */}
                {zoneType === "private" && (
                  <Alert
                    type="info"
                    header="Amazon VPC association required"
                  >
                    To create a private hosted zone, you must associate it with an Amazon VPC.
                  </Alert>
                )}

              </SpaceBetween>
            </Container>

            {/* Tags Container (Visual Match for AWS Console) */}
            <Container
              header={
                <Header 
                  variant="h2" 
                  description="A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs."
                  info={<Link variant="info">Info</Link>}
                >
                  Tags - <i>optional</i>
                </Header>
              }
            >
              <Button formAction="none" iconName="add-plus">
                Add tag
              </Button>
            </Container>

          </SpaceBetween>
        </Form>
      </form>
    </ConsoleLayout>
  );
}