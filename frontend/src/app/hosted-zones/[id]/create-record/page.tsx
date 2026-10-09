"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  SpaceBetween,
  Button,
  Container,
  Header,
  FormField,
  Input,
  Textarea,
  Select,
  Grid
} from "@cloudscape-design/components";
import ConsoleLayout from "@/components/ConsoleLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RECORD_TYPES = [
  { label: "A - Routes traffic to an IPv4 address and some AWS resources", value: "A" },
  { label: "AAAA - Routes traffic to an IPv6 address and some AWS resources", value: "AAAA" },
  { label: "CNAME - Routes traffic to another domain name and to some AWS resources", value: "CNAME" },
  { label: "TXT - Routes traffic to text strings for domain verification and email spoofing prevention", value: "TXT" },
  { label: "MX - Specifies mail servers", value: "MX" },
  { label: "NS - Identifies name servers for the hosted zone", value: "NS" },
  { label: "PTR - Routes traffic to a domain name from an IP address", value: "PTR" },
  { label: "SRV - Routes traffic to a specific port and server", value: "SRV" },
  { label: "CAA - Restricts which certificate authorities can issue certificates for a domain", value: "CAA" },
];

function CreateDNSRecordContent() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.id as string;

  const [zoneDomain, setZoneDomain] = useState("");
  const [recordName, setRecordName] = useState("");
  const [recordType, setRecordType] = useState(RECORD_TYPES[0]);
  const [recordValue, setRecordValue] = useState("");
  const [ttl, setTtl] = useState("300");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!zoneId) return;
    const fetchZone = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}`);
        if (res.ok) {
          const data = await res.json();
          setZoneDomain(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch zone details:", error);
      }
    };
    fetchZone();
  }, [zoneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!recordValue.trim()) {
      setErrorMessage("Record value is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recordName.trim(), 
          type: recordType.value,
          value: recordValue.trim(),
          ttl: parseInt(ttl) || 300,
          routing_policy: "Simple",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create DNS record.");
      }

      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout
      activeHref="/hosted-zones"
      pageTitle="Create record"
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Hosted zones", href: "/hosted-zones" },
        { text: zoneDomain || zoneId, href: `/hosted-zones/${zoneId}` },
        { text: "Create record", href: `/hosted-zones/${zoneId}/create-record` },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                Create record
              </Button>
            </SpaceBetween>
          }
          errorText={errorMessage}
        >
          <SpaceBetween size="l">
            <Container header={<Header variant="h2">Record details</Header>}>
              <SpaceBetween size="l">
                
                <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
                  <FormField
                    label="Record name"
                    description="Enter the name for the record."
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          value={recordName}
                          onChange={({ detail }) => setRecordName(detail.value)}
                          placeholder="e.g. www, api, or leave blank for apex"
                        />
                      </div>
                      <div style={{ marginLeft: "8px", color: "var(--color-text-body-secondary, #aab7b8)", whiteSpace: "nowrap" }}>
                        .{zoneDomain}
                      </div>
                    </div>
                  </FormField>

                  <FormField
                    label="Record type"
                    description="Select the DNS record type."
                  >
                    <Select
                      selectedOption={recordType}
                      onChange={({ detail }) => setRecordType(detail.selectedOption as any)}
                      options={RECORD_TYPES}
                    />
                  </FormField>
                </Grid>

                <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                  <FormField
                    label="Value"
                    description="Enter multiple values on separate lines."
                    stretch={true}
                  >
                    <Textarea
                      value={recordValue}
                      onChange={({ detail }) => setRecordValue(detail.value)}
                      placeholder={`Enter ${recordType.value} values...`}
                      rows={5}
                    />
                  </FormField>

                  <FormField
                    label="TTL (seconds)"
                    description="Time to live in seconds."
                  >
                    <Input
                      type="number"
                      value={ttl}
                      onChange={({ detail }) => setTtl(detail.value)}
                    />
                  </FormField>
                </Grid>

              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    </ConsoleLayout>
  );
}

export default function CreateDNSRecord() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0f1b2a" }} />}>
      <CreateDNSRecordContent />
    </Suspense>
  );
}