"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  Header,
  SpaceBetween,
  Button,
  TextFilter,
  Pagination,
  Box,
  Modal,
  Container, Select
} from "@cloudscape-design/components";
import ConsoleLayout from "@/components/ConsoleLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HostedZone {
  id: string;
  name: string;
  comment: string | null;
  zone_type: string;
}

interface DNSRecord {
  id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
  routing_policy: string;
  is_system_record: number;
}

// 1. The main logic component that safely consumes the dynamic URL parameter
function HostedZoneDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DNSRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [selectedRecordType, setSelectedRecordType] = useState<{label?: string, value?: string} | null>(null);
  const pageSize = 100;

  useEffect(() => {
    if (!zoneId) return;
    const fetchZoneAndRecords = async () => {
      setIsLoading(true);
      try {
        const zoneRes = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}`);
        if (zoneRes.ok) setZone(await zoneRes.json());

        const skip = (currentPageIndex - 1) * pageSize;
        let recordUrl = `${API_BASE_URL}/api/hosted-zones/${zoneId}/records?skip=${skip}&limit=${pageSize}`;
        if (searchQuery) recordUrl += `&search=${searchQuery}`;
        if (selectedRecordType?.value) recordUrl += `&type=${selectedRecordType.value}`;
        
        const recordsRes = await fetch(recordUrl);
        if (recordsRes.ok) setRecords(await recordsRes.json());
      } catch (error) {
        console.error("Failed to fetch zone data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchZoneAndRecords(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [zoneId, searchQuery, currentPageIndex, selectedRecordType]);

  const handleDeleteRecord = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const recordIds = selectedItems.filter(item => item.is_system_record === 0).map(item => item.id);
      
      if (recordIds.length > 0) {
        await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records/bulk-delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ record_ids: recordIds }),
        });
      }

      setIsDeleteModalOpen(false);
      setSelectedItems([]);
      
      // Explicitly re-fetch the data to guarantee the table updates
      const skip = (currentPageIndex - 1) * pageSize;
      let recordUrl = `${API_BASE_URL}/api/hosted-zones/${zoneId}/records?skip=${skip}&limit=${pageSize}`;
      if (searchQuery) recordUrl += `&search=${searchQuery}`;
      if (selectedRecordType?.value) recordUrl += `&type=${selectedRecordType.value}`;
      
      const recordsRes = await fetch(recordUrl);
      if (recordsRes.ok) {
        setRecords(await recordsRes.json());
      }
      
    } catch (error) {
      console.error("Failed to delete records:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSystemRecordSelected = selectedItems.some(item => item.is_system_record === 1);

  return (
    <ConsoleLayout
      activeHref="/hosted-zones"
      pageTitle={zone?.name || "Hosted zone details"}
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Hosted zones", href: "/hosted-zones" },
        { text: zone?.name || zoneId, href: `/hosted-zones/${zoneId}` },
      ]}
    >
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Hosted zone details</Header>}>
          <SpaceBetween size="m">
            <div>
              <Box variant="awsui-key-label">Domain name</Box>
              <Box variant="p">{zone?.name || "-"}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Hosted zone ID</Box>
              <Box variant="p">{zone?.id || "-"}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Description</Box>
              <Box variant="p">{zone?.comment || "-"}</Box>
            </div>
          </SpaceBetween>
        </Container>

        <Table
          columnDefinitions={[
            {
              id: "name",
              header: "Record name",
              cell: item => item.name,
              isRowHeader: true
            },
            {
              id: "type",
              header: "Type",
              cell: item => item.type
            },
            {
              id: "routing",
              header: "Routing policy",
              cell: item => item.routing_policy || "Simple"
            },
            {
              id: "value",
              header: "Value/Route traffic to",
              cell: item => (
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {item.value}
                </div>
              )
            },
            {
              id: "ttl",
              header: "TTL (seconds)",
              cell: item => item.ttl
            }
          ]}
          items={records}
          loading={isLoading}
          loadingText="Loading records..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as DNSRecord[])}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No records found</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                No DNS records exist for this hosted zone.
              </Box>
              <Button onClick={() => router.push(`/hosted-zones/${zoneId}/create-record`)}>Create record</Button>
            </Box>
          }
          filter={
            <SpaceBetween direction="horizontal" size="m">
              <TextFilter
                filteringPlaceholder="Find records by name"
                filteringText={searchQuery}
                onChange={({ detail }) => {
                  setSearchQuery(detail.filteringText);
                  setCurrentPageIndex(1);
                }}
              />
              <div style={{ width: "200px" }}>
                <Select
                  selectedOption={selectedRecordType}
                  onChange={({ detail }) => {
                    setSelectedRecordType(detail.selectedOption);
                    setCurrentPageIndex(1);
                  }}
                  options={[
                    { label: "All types", value: "" },
                    { label: "A - IPv4 address", value: "A" },
                    { label: "AAAA - IPv6 address", value: "AAAA" },
                    { label: "CNAME - Canonical name", value: "CNAME" },
                    { label: "MX - Mail exchange", value: "MX" },
                    { label: "TXT - Text", value: "TXT" },
                    { label: "NS - Name server", value: "NS" },
                  ]}
                  placeholder="Filter by type"
                  empty="No options"
                />
              </div>
            </SpaceBetween>
          }
          header={
            <Header
              variant="h2"
              counter={`(${records.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    disabled={selectedItems.length === 0 || isSystemRecordSelected} 
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete record
                  </Button>
                  <Button 
                    disabled={selectedItems.length !== 1 || isSystemRecordSelected}
                    onClick={() => router.push(`/hosted-zones/${zoneId}/edit-record/${selectedItems[0].id}`)}
                  >
                    Edit record
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push(`/hosted-zones/${zoneId}/create-record`)}
                  >
                    Create record
                  </Button>
                </SpaceBetween>
              }
            >
              Records
            </Header>
          }
          pagination={
            <Pagination 
              currentPageIndex={currentPageIndex} 
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
              pagesCount={records.length === pageSize ? currentPageIndex + 1 : currentPageIndex} 
            />
          }
        />

        <Modal
          onDismiss={() => setIsDeleteModalOpen(false)}
          visible={isDeleteModalOpen}
          closeAriaLabel="Close modal"
          header="Delete record(s)"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleDeleteRecord} loading={isProcessing}>Delete</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Box variant="span">
              Are you sure you want to delete {selectedItems.length} selected record(s)?
            </Box>
            <Box variant="span" color="text-status-error">
              This action cannot be undone and may affect how traffic is routed to your domain.
            </Box>
          </SpaceBetween>
        </Modal>

      </SpaceBetween>
    </ConsoleLayout>
  );
}

// 2. The default export wraps the content in Suspense to bypass Next.js server prerendering blocks
export default function HostedZoneDetails() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0f1b2a" }} />}>
      <HostedZoneDetailsContent />
    </Suspense>
  );
}