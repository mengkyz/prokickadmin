"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PackageModal } from "@/components/packages/PackageModal";
import { PACKAGES } from "@/lib/mock/data";
import type { Package } from "@/lib/types";

type Modal = "none" | "create" | "edit";

export default function PackagesPage() {
  const [modal, setModal] = useState<Modal>("none");
  const [editTarget, setEditTarget] = useState<Package | undefined>();

  function openEdit(pkg: Package) {
    setEditTarget(pkg);
    setModal("edit");
  }

  const adult = PACKAGES.filter((p) => p.category === "Adult");
  const junior = PACKAGES.filter((p) => p.category === "Junior");

  const PackageTable = ({ packages }: { packages: Package[] }) => (
    <table>
      <thead>
        <tr><th>ชื่อ</th><th>ราคา</th><th>Sessions</th><th>วัน</th><th>Extra</th><th></th></tr>
      </thead>
      <tbody>
        {packages.map((pkg) => (
          <tr key={pkg.id}>
            <td><div style={{ fontSize: 12, fontWeight: 600 }}>{pkg.name}</div></td>
            <td className="pk-mono" style={{ color: "var(--orange)" }}>{pkg.price.toLocaleString()} ฿</td>
            <td className="pk-mono">{pkg.sessions}</td>
            <td className="pk-mono">{pkg.durationDays}</td>
            <td className="pk-mono">{pkg.extraLimit > 0 ? `${pkg.extraLimit}×${pkg.extraPrice}฿` : "—"}</td>
            <td>
              <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>แก้ไข</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card>
          <CardHeader
            icon="📦"
            title="แพ็กเกจผู้ใหญ่"
            actions={<Button variant="primary" size="sm" onClick={() => setModal("create")}>+ สร้างแพ็กเกจ</Button>}
          />
          <PackageTable packages={adult} />
        </Card>

        <Card>
          <CardHeader
            icon="🧒"
            title="แพ็กเกจเด็ก"
            actions={<Button variant="primary" size="sm" onClick={() => setModal("create")}>+ สร้างแพ็กเกจ</Button>}
          />
          <PackageTable packages={junior} />
        </Card>
      </div>

      <PackageModal open={modal === "create"} onClose={() => setModal("none")} mode="create" />
      <PackageModal open={modal === "edit"} onClose={() => setModal("none")} mode="edit" initial={editTarget} />
    </>
  );
}
