"use client";

import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

interface JsonServerManagerProps {
  jsonServerUrl: string;
  onUrlChange?: (url: string) => void;
}

interface HealthStatus {
  status: string;
  url: string;
  timestamp?: string;
  error?: string;
}

interface TableParams {
  pagination: TablePaginationConfig;
  filters: Record<string, (string | number | boolean)[] | null>;
  sorter: {
    field: string;
    order: "ascend" | "descend" | null;
  };
}

export default function JsonServerManager({
  jsonServerUrl,
  onUrlChange,
}: JsonServerManagerProps) {
  const [resources, setResources] = useState<string[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState<string>("");
  const [invalidResources, setInvalidResources] = useState<Set<string>>(
    new Set(),
  );
  const [probeFailed, setProbeFailed] = useState<string[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {},
    sorter: {
      field: "",
      order: null,
    },
  });

  // 获取资源列表
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/jsonserver?url=${encodeURIComponent(jsonServerUrl)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      // 检查是否是错误响应
      if (result.error) {
        // 显示错误信息
        message.error(result.error);
        setResources([]);
        return;
      }

      // 检查是否是资源列表响应
      if (result.resources && Array.isArray(result.resources)) {
        setResources(result.resources);
        setInvalidResources(new Set()); // 重置无效资源列表

        // 显示发现的消息
        if (result.message) {
          message.success(result.message);
        }

        // 如果有详细信息（如资源数量），显示它们
        if (result.details && Array.isArray(result.details)) {
          const detailsText = result.details
            .map((d: any) => `${d.name} (${d.count})`)
            .join(", ");
          message.info(`资源详情: ${detailsText}`);
        }

        // 如果有探测失败的资源，显示它们
        if (
          result.failed &&
          Array.isArray(result.failed) &&
          result.failed.length > 0
        ) {
          setProbeFailed(result.failed);
          message.warning(`探测失败的资源: ${result.failed.join(", ")}`);
        } else {
          setProbeFailed([]);
        }

        return;
      }

      // 兼容旧格式：直接返回数组
      if (Array.isArray(result)) {
        setResources(result);
        setInvalidResources(new Set());
        setProbeFailed([]);
        message.success(`已加载 ${result.length} 个资源`);
        return;
      }

      // 兼容旧格式：返回对象
      if (typeof result === "object" && result !== null && !result.error) {
        const resources = Object.keys(result);
        setResources(resources);
        setInvalidResources(new Set());
        setProbeFailed([]);
        message.success(`已加载 ${resources.length} 个资源`);
        return;
      }

      // 无法识别的响应格式
      setResources([]);
      setProbeFailed([]);
      message.warning("无法识别的资源列表格式");
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      message.error(
        error instanceof Error ? error.message : "获取资源列表失败",
      );
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [jsonServerUrl]);

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!selectedResource) return;

    try {
      setLoading(true);
      const { pagination, sorter, filters } = tableParams;
      const params = new URLSearchParams({
        _page: String(pagination.current || 1),
        _limit: String(pagination.pageSize || 10),
      });

      // 添加排序参数
      if (sorter.field && sorter.order) {
        params.append("_sort", sorter.field);
        params.append("_order", sorter.order === "ascend" ? "asc" : "desc");
      }

      // 添加搜索参数
      if (searchText) {
        params.append("q", searchText);
      }

      // 添加过滤参数
      Object.entries(filters || {}).forEach(([key, values]) => {
        if (values && values.length > 0) {
          values.forEach((value) => {
            params.append(key, String(value));
          });
        }
      });

      const response = await fetch(
        `/api/jsonserver?resource=${selectedResource}&${params.toString()}&url=${encodeURIComponent(
          jsonServerUrl,
        )}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // 如果是 404 错误，标记资源为无效
        if (response.status === 404) {
          setInvalidResources((prev) => new Set(prev).add(selectedResource));
          message.error(`资源 "${selectedResource}" 不存在`);
          setData([]);
          return;
        }

        throw new Error(errorData.error || errorData.details || "获取数据失败");
      }

      const result = await response.json();
      const totalCount = response.headers.get("X-Total-Count");

      setData(Array.isArray(result) ? result : [result]);
      setTableParams({
        ...tableParams,
        pagination: {
          ...pagination,
          total: totalCount
            ? parseInt(totalCount, 10)
            : Array.isArray(result)
              ? result.length
              : 1,
        },
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error(error instanceof Error ? error.message : "获取数据失败");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedResource, jsonServerUrl]); // 移除 tableParams 和 searchText 依赖

  // 检查健康状态
  const checkHealth = useCallback(async () => {
    try {
      setIsCheckingHealth(true);
      const response = await fetch(
        `/api/jsonserver?health=true&url=${encodeURIComponent(jsonServerUrl)}`,
      );
      const data = await response.json();
      setHealthStatus(data);

      if (data.status === "healthy") {
        message.success("连接正常");
      } else {
        message.error(`连接异常: ${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Failed to check health:", error);
      setHealthStatus({
        status: "unhealthy",
        url: jsonServerUrl,
        error: error instanceof Error ? error.message : "连接失败",
      });
      message.error("无法连接到 JSON Server");
    } finally {
      setIsCheckingHealth(false);
    }
  }, [jsonServerUrl]);

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 编辑记录
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      data: JSON.stringify(record, null, 2),
    });
    setIsModalOpen(true);
  };

  // 删除记录
  const handleDelete = (record: any) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除这条记录吗？ID: ${record.id}`,
      onOk: async () => {
        try {
          const response = await fetch(
            `/api/jsonserver?resource=${selectedResource}&id=${record.id}&url=${encodeURIComponent(
              jsonServerUrl,
            )}`,
            {
              method: "DELETE",
            },
          );

          if (!response.ok) {
            throw new Error("删除失败");
          }

          message.success("删除成功");
          fetchData();
        } catch (error) {
          console.error("Failed to delete:", error);
          message.error("删除失败");
        }
      },
    });
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      const jsonData = JSON.parse(values.data);

      if (editingRecord) {
        // 更新
        const response = await fetch(
          `/api/jsonserver?resource=${selectedResource}&id=${editingRecord.id}&url=${encodeURIComponent(
            jsonServerUrl,
          )}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
          },
        );

        if (!response.ok) {
          throw new Error("更新失败");
        }

        message.success("更新成功");
      } else {
        // 新增
        const response = await fetch(
          `/api/jsonserver?resource=${selectedResource}&url=${encodeURIComponent(
            jsonServerUrl,
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
          },
        );

        if (!response.ok) {
          throw new Error("添加失败");
        }

        message.success("添加成功");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error("Failed to submit:", error);
      if (error instanceof SyntaxError) {
        message.error("JSON 格式错误");
      } else {
        message.error(error instanceof Error ? error.message : "操作失败");
      }
    }
  };

  // 表格列配置 - 使用 useMemo 避免不必要的重新渲染
  const columns: ColumnsType<any> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: true,
      fixed: "left" as const,
    },
    // 动态列基于第一条数据
    ...(data.length > 0
      ? Object.keys(data[0])
          .filter((key) => key !== "id")
          .map((key) => ({
            title: key,
            dataIndex: key,
            key,
            ellipsis: true,
            sorter: true,
            render: (value: any) => {
              if (typeof value === "object" && value !== null) {
                return (
                  <Tooltip title={JSON.stringify(value)}>
                    <Tag color="blue">Object</Tag>
                  </Tooltip>
                );
              }
              if (typeof value === "boolean") {
                return (
                  <Tag color={value ? "green" : "red"}>{String(value)}</Tag>
                );
              }
              if (typeof value === "number") {
                return <Tag color="purple">{value}</Tag>;
              }
              return String(value);
            },
          }))
      : []),
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right" as const,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 表格变化处理
  const handleTableChange: TableProps<any>["onChange"] = (
    newPagination,
    filters,
    sorter,
  ) => {
    setTableParams({
      pagination: newPagination,
      filters,
      sorter: {
        field: (sorter.field as string) || "",
        order: sorter.order as "ascend" | "descend" | null,
      },
    });
  };

  // 初始化
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // 资源变化时重新获取数据
  useEffect(() => {
    if (selectedResource) {
      fetchData();
    }
  }, [selectedResource, jsonServerUrl]); // 移除 fetchData 依赖

  return (
    <Card
      title="JSON Server 管理"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={checkHealth}
            loading={isCheckingHealth}
          >
            检查连接
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={!selectedResource}
          >
            添加记录
          </Button>
        </Space>
      }
    >
      {/* 健康状态 */}
      {healthStatus && (
        <div
          className={`mb-4 p-3 rounded ${
            healthStatus.status === "healthy"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                healthStatus.status === "healthy"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {healthStatus.status === "healthy" ? "✓" : "✗"}
              {healthStatus.status === "healthy" ? " 连接正常" : " 连接异常"}
            </span>
            {healthStatus.url && (
              <span className="text-xs text-gray-500">
                ({healthStatus.url})
              </span>
            )}
          </div>
          {healthStatus.error && (
            <div className="text-xs text-red-600 mt-1">
              错误: {healthStatus.error}
            </div>
          )}
          {healthStatus.timestamp && (
            <div className="text-xs text-gray-500 mt-1">
              检查时间:{" "}
              {new Date(healthStatus.timestamp).toLocaleString("zh-CN")}
            </div>
          )}
        </div>
      )}

      {/* URL 配置 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JSON Server URL
        </label>
        <Input
          value={jsonServerUrl}
          onChange={(e) => onUrlChange?.(e.target.value)}
          placeholder="http://localhost:3001"
          onBlur={() => {
            localStorage.setItem("jsonServerUrl", jsonServerUrl);
            message.success("URL 已保存");
          }}
        />
        <div className="mt-2 text-xs text-gray-500">
          💡 提示：请输入完整地址,包含 http(s)://
        </div>
      </div>

      {/* 资源选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择资源
        </label>
        <select
          value={selectedResource}
          onChange={(e) => {
            setSelectedResource(e.target.value);
            setTableParams({
              ...tableParams,
              pagination: { ...tableParams.pagination, current: 1 },
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择资源</option>
          {resources
            .filter((resource) => !invalidResources.has(resource))
            .map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
        </select>
      </div>

      {/* 数据表格 */}
      {selectedResource && (
        <>
          {/* 搜索框 */}
          <div className="mb-4">
            <Input
              placeholder="搜索数据..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchData()} // 确保调用函数
              allowClear
            />
          </div>

          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
            rowKey="id"
            size="middle"
            bordered
          />
        </>
      )}

      {!selectedResource && (
        <div className="text-center py-8 text-gray-400">
          请选择一个资源以查看数据
        </div>
      )}

      {/* 探测失败的资源提示 */}
      {probeFailed.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ 探测失败的资源：</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            以下资源可能存在但探测失败：{probeFailed.join(", ")}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            💡 提示：如果这些资源确实存在，请检查 JSON Server 配置或网络连接
          </p>
        </div>
      )}

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingRecord ? "编辑记录" : "添加记录"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              当前资源: <span className="font-medium">{selectedResource}</span>
              {editingRecord && (
                <span className="ml-2">
                  | 记录 ID:{" "}
                  <span className="font-medium">{editingRecord.id}</span>
                </span>
              )}
            </p>
          </div>
          <Form.Item
            name="data"
            label="JSON 数据"
            rules={[
              { required: true, message: "请输入 JSON 数据" },
              {
                validator: (_, value) => {
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("JSON 格式无效"));
                  }
                },
              },
            ]}
            tooltip="请输入有效的 JSON 格式数据"
          >
            <Input.TextArea
              rows={15}
              placeholder='请输入 JSON 数据，例如: {"name": "test", "value": 123}'
              style={{ fontFamily: "monospace", fontSize: "12px" }}
            />
          </Form.Item>
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-xs text-blue-700">
              💡 提示：编辑时请确保包含 id 字段，否则会创建新记录
            </p>
          </div>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "更新" : "添加"}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
