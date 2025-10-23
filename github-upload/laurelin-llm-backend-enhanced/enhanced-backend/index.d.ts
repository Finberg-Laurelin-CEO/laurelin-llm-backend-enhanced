import { CloudEvent } from '@google-cloud/functions-framework';
import { Request, Response } from 'express';
export declare const onConvoInput: (cloudEvent: CloudEvent) => Promise<import("./src/types").LLMResponse>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export declare const chatAPI: (req: Request, res: Response) => Promise<void>;
export declare const loginAPI: (req: Request, res: Response) => Promise<void>;
export declare const responseAPI: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=index.d.ts.map