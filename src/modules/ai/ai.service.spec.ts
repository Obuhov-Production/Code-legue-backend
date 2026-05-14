import { Test } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

const generateContentMock = jest.fn();

jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            models: {
                generateContent: generateContentMock,
            },
        })),
    };
});

describe('AiService', () => {
    let service: AiService;

    beforeEach(async () => {
        generateContentMock.mockReset();

        const module = await Test.createTestingModule({
            providers: [
                AiService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('fake-api-key'),
                    },
                },
            ],
        }).compile();

        service = module.get(AiService);
    });

    it('should return AI response text', async () => {
        generateContentMock.mockResolvedValue({
            text: 'AI response text',
        });

        const result = await service.chat([
            { role: 'user', content: 'Hello' },
        ]);

        expect(result).toBe('AI response text');
        expect(generateContentMock).toHaveBeenCalled();
    });

    it('should throw if AI response is empty', async () => {
        generateContentMock.mockResolvedValue({
            text: '',
        });

        await expect(
            service.chat([{ role: 'user', content: 'Hi' }]),
        ).rejects.toThrow('AI response is empty');
    });
});