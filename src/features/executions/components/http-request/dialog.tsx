"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JsonEditor } from "@/components/json-editor";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_$]*$/,
      "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores"
    ),
  endpoint: z.url("Please enter a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  body: z.string().optional(),
  // .refine() TODO JSON5
});

export type HttpRequestFormValues = z.infer<typeof formSchema>;

const formatRequestBody = (body: string): string | null => {
  const trimmed = body.trim();
  if (!trimmed) return body;

  const tryFormat = (v: string) => JSON.stringify(JSON.parse(v), null, 2);

  try {
    return tryFormat(trimmed);
  } catch {
    const tokenMap = new Map<string, string>();
    let i = 0;
    const sanitized = trimmed.replace(/\{\{[^{}]+\}\}/g, (match) => {
      const token = `"__TPL_${i++}__"`;
      tokenMap.set(`__TPL_${i - 1}__`, match);
      return token;
    });

    try {
      const formatted = tryFormat(sanitized);
      return formatted.replace(
        /"(__TPL_\d+__)"/g,
        (_, t) => tokenMap.get(t) ?? t
      );
    } catch {
      return null;
    }
  }
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues: Partial<HttpRequestFormValues>;
}

export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      endpoint: defaultValues.endpoint ?? "",
      method: defaultValues.method ?? "GET",
      body: defaultValues.body ?? "",
      variableName: defaultValues.variableName ?? "",
    },
  });
  // Reset form when dialog is opened
  useEffect(() => {
    if (open) {
      form.reset({
        endpoint: defaultValues.endpoint ?? "",
        method: defaultValues.method ?? "GET",
        body: defaultValues.body ?? "",
        variableName: defaultValues.variableName ?? "",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "myApiCall";
  const watchMethod = form.watch("method");
  const showBodyField = ["POST", "PUT", "PATCH"].includes(watchMethod);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HTTP Request</DialogTitle>
          <DialogDescription>
            Configure settings for the HTTP request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myApiCall" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the response data in other nodes:{" "}
                    {"{{" + watchVariableName + ".httpResponse.data}}"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The HTTP method to use for this request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/users/{{httpResponse.data.id}}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Static URL or use {"{{variables}}"} for simple values or{" "}
                    {"{{json variable}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showBodyField && (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Request Body</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const formatted = formatRequestBody(
                            field.value ?? ""
                          );
                          if (formatted !== null) {
                            form.clearErrors("body");
                            field.onChange(formatted);
                          } else {
                            form.setError("body", {
                              type: "validate",
                              message:
                                "Invalid JSON. Check syntax and try again.",
                            });
                          }
                        }}
                      >
                        Format JSON
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <JsonEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={() => {
                          const formatted = formatRequestBody(
                            field.value ?? ""
                          );
                          if (formatted !== null) {
                            form.clearErrors("body");
                            if (formatted !== field.value) {
                              field.onChange(formatted);
                            }
                          } else {
                            form.setError("body", {
                              type: "validate",
                              message:
                                "Invalid JSON. Check syntax and try again.",
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Use {"{{variables}}"} for simple values or{" "}
                      {"{{json variable}}"} to stringify objects
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="mt-4">
              <Button className="w-full" type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
