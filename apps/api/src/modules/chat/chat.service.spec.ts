import type { Conversation, Hospital, Message, User } from "@prisma/client";
import { ChatService } from "./chat.service";
import { ChatRepository, type ConversationWithUsers, type MessageWithSender } from "./chat.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { NotificationService } from "../notifications/notification.service";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";

function makeUser(overrides: Partial<User> = {}): User {
  return { id: "user-1", name: "Chủ nuôi", avatar: null, ...overrides } as User;
}

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return { id: "hospital-1", ownerId: "hospital-owner-1", name: "Happy Paws", ...overrides } as Hospital;
}

function makeConversation(overrides: Partial<ConversationWithUsers> = {}): ConversationWithUsers {
  return {
    id: "conv-1",
    user1Id: "owner-1",
    user2Id: "hospital-owner-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    user1: makeUser({ id: "owner-1", name: "Chủ nuôi" }),
    user2: makeUser({ id: "hospital-owner-1", name: "Nguyen Van A" }),
    ...overrides,
  } as ConversationWithUsers;
}

function makeMessage(overrides: Partial<MessageWithSender> = {}): MessageWithSender {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "owner-1",
    message: "Xin chào",
    messageType: "text",
    mediaUrl: null,
    isRead: false,
    createdAt: new Date(),
    sender: makeUser({ id: "owner-1", name: "Chủ nuôi" }),
    ...overrides,
  } as MessageWithSender;
}

function setup() {
  const repository = {
    findOrCreateConversation: jest.fn(),
    findConversationById: jest.fn(),
    findManyConversations: jest.fn(),
    findLastMessage: jest.fn(),
    countUnread: jest.fn(),
    findMessages: jest.fn(),
    createMessage: jest.fn(),
    markConversationRead: jest.fn(),
  } as unknown as jest.Mocked<ChatRepository>;

  const hospitalRepository = { findById: jest.fn() } as unknown as jest.Mocked<HospitalRepository>;
  const notificationService = { create: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;

  const service = new ChatService(repository, hospitalRepository, notificationService);

  return { service, repository, hospitalRepository, notificationService };
}

describe("ChatService.startWithHospital", () => {
  it("finds or creates a conversation with the hospital's owner", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    repository.findOrCreateConversation.mockResolvedValue(makeConversation());
    repository.countUnread.mockResolvedValue(0);
    repository.findLastMessage.mockResolvedValue(null);

    const dto = await service.startWithHospital("owner-1", "hospital-1");

    expect(repository.findOrCreateConversation).toHaveBeenCalledWith("owner-1", "hospital-owner-1");
    expect(dto.otherUserId).toBe("hospital-owner-1");
  });

  it("raises NotFoundError for a hospital with no owner account", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findById.mockResolvedValue(makeHospital({ ownerId: null } as never));

    await expect(service.startWithHospital("owner-1", "hospital-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ChatService.sendMessage", () => {
  it("sends a text message and notifies the other participant", async () => {
    const { service, repository, notificationService } = setup();
    repository.findConversationById.mockResolvedValue(makeConversation() as unknown as Conversation);
    repository.createMessage.mockResolvedValue(makeMessage());

    await service.sendMessage("conv-1", "owner-1", { message: "Xin chào" });

    expect(repository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1", senderId: "owner-1", messageType: "text" }),
    );
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "hospital-owner-1", type: "MESSAGE" }),
    );
  });

  it("marks messageType as image when a mediaUrl is sent", async () => {
    const { service, repository } = setup();
    repository.findConversationById.mockResolvedValue(makeConversation() as unknown as Conversation);
    repository.createMessage.mockResolvedValue(makeMessage({ messageType: "image", mediaUrl: "https://x.test/a.png" }));

    await service.sendMessage("conv-1", "owner-1", { mediaUrl: "https://x.test/a.png" });

    expect(repository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: "image", mediaUrl: "https://x.test/a.png" }),
    );
  });

  it("rejects a non-participant from sending a message", async () => {
    const { service, repository } = setup();
    repository.findConversationById.mockResolvedValue(makeConversation() as unknown as Conversation);

    await expect(service.sendMessage("conv-1", "someone-else", { message: "hi" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.createMessage).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a conversation that doesn't exist", async () => {
    const { service, repository } = setup();
    repository.findConversationById.mockResolvedValue(null);

    await expect(service.sendMessage("missing", "owner-1", { message: "hi" })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ChatService.getMessages", () => {
  it("marks the conversation read and returns messages", async () => {
    const { service, repository } = setup();
    repository.findConversationById.mockResolvedValue(makeConversation() as unknown as Conversation);
    repository.findMessages.mockResolvedValue([makeMessage()]);

    const messages = await service.getMessages("conv-1", "owner-1");

    expect(repository.markConversationRead).toHaveBeenCalledWith("conv-1", "owner-1");
    expect(messages).toHaveLength(1);
  });

  it("rejects a non-participant from reading messages", async () => {
    const { service, repository } = setup();
    repository.findConversationById.mockResolvedValue(makeConversation() as unknown as Conversation);

    await expect(service.getMessages("conv-1", "someone-else")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
