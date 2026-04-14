import { Injectable } from '@nestjs/common';
import {GoogleGenAI} from "@google/genai";
import {ConfigService} from "@nestjs/config";

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

@Injectable()
export class AiService {
    private genAI: GoogleGenAI;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }

        this.genAI = new GoogleGenAI({ apiKey });
    }

    async chat(messages: Message[]): Promise<string> {
        const contents = messages.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });

        const text = response?.text?.trim();

        if (!text) {
            throw new Error('AI response is empty');
        }

        return text;
    }

}
