import { LinkOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Spin, Typography, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { createImageList } from "@/engines/transform";
import { fetchUrlsAsFiles } from "@/services/urlFetcher";
import { gstate } from "@/global";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const UrlInputDialog = observer(() => {
  const [open, setOpen] = useState(false);
  const [urlText, setUrlText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errors, setErrors] = useState<{ url: string; error: string }[]>([]);

  const locale = gstate.locale?.urlInput;

  const onOpen = () => {
    setUrlText("");
    setErrors([]);
    setOpen(true);
  };

  const onCancel = () => {
    if (fetching) return;
    setOpen(false);
  };

  const onSubmit = async () => {
    const urls = urlText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      message.warning(locale?.emptyHint || "Please enter at least one URL");
      return;
    }

    setErrors([]);
    setFetching(true);
    setProgress({ done: 0, total: urls.length });

    const { results, errors: fetchErrors } = await fetchUrlsAsFiles(urls, (done) => {
      setProgress({ done, total: urls.length });
    });

    setFetching(false);

    if (fetchErrors.length > 0) {
      setErrors(fetchErrors);
    }

    if (results.length > 0) {
      const files = results.map((r) => r.file);
      await createImageList(files);
      message.success(`Successfully imported ${results.length} image(s)`);
    }

    if (fetchErrors.length === 0) {
      setOpen(false);
      setUrlText("");
    }
  };

  return (
    <>
      <Space>
        <Button onClick={onOpen} disabled={gstate.loading} icon={<LinkOutlined />}>
          {gstate.locale?.listAction.addUrl}
        </Button>
      </Space>
      <Modal
        title={locale?.title || "Import images from URL"}
        open={open}
        onCancel={onCancel}
        onOk={onSubmit}
        okText={locale?.confirm || "Fetch"}
        cancelText={locale?.cancel || "Cancel"}
        okButtonProps={{ disabled: fetching, loading: fetching }}
        maskClosable={!fetching}
        closable={!fetching}
      >
        <Typography.Text type="secondary" style={{ marginBottom: 8, display: "block" }}>
          {locale?.placeholder || "Enter image URLs, one per line"}
        </Typography.Text>
        <TextArea
          rows={6}
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
          disabled={fetching}
        />
        {fetching && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Spin tip={`${locale?.fetching || "Fetching images..."} (${progress.done}/${progress.total})`} />
          </div>
        )}
        {errors.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Typography.Text type="danger">
              {locale?.errorTitle || "Failed to fetch some images"}:
            </Typography.Text>
            {errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: "#ff4d4f", marginTop: 4 }}>
                {e.url}: {e.error}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
});
